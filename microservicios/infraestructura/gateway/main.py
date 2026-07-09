import os
import httpx
import yaml
import jwt
import logging

import consul
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("gateway")

CONFIG_SERVER_URL = os.getenv("CONFIG_SERVER_URL", "http://localhost:8888")
CONSUL_HOST = os.getenv("CONSUL_HOST", "localhost")
CONSUL_PORT = int(os.getenv("CONSUL_PORT", "8500"))
GATEWAY_PORT = int(os.getenv("PORT", "8000"))

app = FastAPI(title="API Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Cargar configuración desde Config Server ────────
def load_config():
    try:
        r = httpx.get(f"{CONFIG_SERVER_URL}/gateway/default", timeout=5)
        r.raise_for_status()
        return yaml.safe_load(r.text)
    except Exception as e:
        logger.warning("No se pudo cargar config del Config Server, usando fallback: %s", e)
        return {
            "server": {"port": GATEWAY_PORT, "name": "api-gateway"},
            "services": {
                "auth": "http://localhost:8001",
                "pacientes": "http://localhost:8002",
                "citas": "http://localhost:8003",
                "medicamentos": "http://localhost:8005",
            },
        }

config = load_config()
SERVICES = config.get("services", {})
JWT_SECRET = None  # Se obtiene del Auth Service
logger.info("SERVICES configurados: %s", SERVICES)

def get_jwt_secret():
    global JWT_SECRET
    if JWT_SECRET:
        return JWT_SECRET
    try:
        r = httpx.get(f"{CONFIG_SERVER_URL}/auth/default", timeout=5)
        r.raise_for_status()
        auth_cfg = r.json()
        JWT_SECRET = auth_cfg.get("jwt", {}).get("secret", "django-insecure-dev-key-change-in-production")
    except Exception as e:
        logger.warning("No se pudo obtener JWT secret del Config Server: %s", e)
        JWT_SECRET = "django-insecure-dev-key-change-in-production"
    return JWT_SECRET

# ── Registrar en Consul ──────────────────────────────
def register_consul():
    try:
        addr = os.getenv("CONSUL_ADDRESS", "127.0.0.1")
        c = consul.Consul(host=CONSUL_HOST, port=CONSUL_PORT)
        c.agent.service.register(
            name="api-gateway",
            service_id="api-gateway-1",
            address=addr,
            port=GATEWAY_PORT,
            check=consul.Check.http(f"http://{addr}:{GATEWAY_PORT}/health/", interval="10s"),
        )
        logger.info("API Gateway registrado en Consul (%s:%s)", CONSUL_HOST, CONSUL_PORT)
    except Exception as e:
        logger.warning("No se pudo registrar en Consul: %s", e)

# ── Mapeo de rutas a servicios ───────────────────────
ROUTE_MAP = [
    ("/api/historiales/", "pacientes"),
    ("/api/hospitales/", "citas"),
    ("/api/medicamentos/", "medicamentos"),
    ("/api/facturacion/", "citas"),
    ("/api/mensajes/", "citas"),
    ("/api/pacientes/", "pacientes"),
    ("/api/medicos/", "citas"),
    ("/api/soporte/", "citas"),
    ("/api/recetas/", "pacientes"),
    ("/api/citas/", "citas"),
    ("/api/auth/", "auth"),
]

# Rutas públicas (no requieren JWT)
PUBLIC_PATHS = [
    "/api/auth/register/",
    "/api/auth/login/",
    "/api/auth/refresh/",
    "/api/auth/verify/",
    "/health/",
    "/health",
]


def is_public(path: str) -> bool:
    stripped = path.rstrip("/")
    if stripped == "/health":
        return True
    for p in PUBLIC_PATHS:
        if path.startswith(p):
            return True
    return False

def validate_jwt(token: str):
    secret = get_jwt_secret()
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# ── Proxy handler ────────────────────────────────────
@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
async def proxy(request: Request, path: str):
    full_path = "/" + path

    # Health endpoint
    if full_path == "/health" or full_path == "/health/":
        return {"status": "ok", "service": "api-gateway"}

    # Validar JWT para rutas protegidas
    payload = None
    if not is_public(full_path):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse(status_code=401, content={"error": "Token requerido"})
        token = auth_header.split(" ", 1)[1]
        payload = validate_jwt(token)
        if payload is None:
            return JSONResponse(status_code=401, content={"error": "Token inválido o expirado"})

    # Determinar servicio destino
    target_service = None
    for prefix, service_name in ROUTE_MAP:
        if full_path.startswith(prefix):
            target_service = SERVICES.get(service_name)
            break

    if not target_service:
        return JSONResponse(status_code=404, content={"error": "Ruta no encontrada"})

    # Reenviar con el path completo (los servicios escuchan en /api/*)
    url = target_service.rstrip("/") + full_path
    query = str(request.url.query)
    if query:
        url += "?" + query

    # Reenviar request
    headers = dict(request.headers)
    headers.pop("host", None)

    if payload:
        headers["X-User-Id"] = str(payload.get("user_id", ""))
        headers["X-User-Email"] = payload.get("email", "")
        headers["X-User-Tipo"] = payload.get("tipo_usuario", "")

    body = await request.body()
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=body,
            )
            return Response(
                content=resp.content,
                status_code=resp.status_code,
                headers=dict(resp.headers),
            )
        except httpx.RequestError as e:
            return JSONResponse(status_code=502, content={"error": f"Error conectando con {target_service}: {str(e)}"})


@app.on_event("startup")
async def startup():
    register_consul()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=GATEWAY_PORT, reload=True)
