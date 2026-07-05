import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "medicamentos_service.settings")

application = get_wsgi_application()

try:
    import consul

    consul_client = consul.Consul(host=os.getenv("CONSUL_HOST", "localhost"), port=8500)
    consul_client.agent.service.register(
        name="medicamentos-service",
        service_id="medicamentos-service-1",
        address="127.0.0.1",
        port=int(os.getenv("PORT", "8005")),
        check=consul.Check.http(
            "http://127.0.0.1:" + os.getenv("PORT", "8005") + "/api/medicamentos/health/",
            interval="10s",
        ),
    )
except Exception:
    pass
