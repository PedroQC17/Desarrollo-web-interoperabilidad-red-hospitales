import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "auth_service.settings")

application = get_wsgi_application()

# ── Registrar en Consul ──────────────────────────────────────────
try:
    import consul

    consul_client = consul.Consul(host=os.getenv("CONSUL_HOST", "localhost"), port=8500)
    consul_client.agent.service.register(
        name="auth-service",
        service_id="auth-service-1",
        address="127.0.0.1",
        port=int(os.getenv("PORT", "8001")),
        check=consul.Check.http(
            "http://127.0.0.1:" + os.getenv("PORT", "8001") + "/health/",
            interval="10s",
        ),
    )
except Exception:
    pass
