import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "medicos_service.settings")

application = get_wsgi_application()

try:
    import consul

    addr = os.getenv("CONSUL_ADDRESS", "127.0.0.1")
    port = os.getenv("PORT", "8003")
    consul_client = consul.Consul(host=os.getenv("CONSUL_HOST", "localhost"), port=8500)
    consul_client.agent.service.register(
        name="medicos-service",
        service_id="medicos-service-1",
        address=addr,
        port=int(port),
        check=consul.Check.http(
            f"http://{addr}:{port}/api/medicos/health/",
            interval="10s",
        ),
    )
except Exception:
    pass
