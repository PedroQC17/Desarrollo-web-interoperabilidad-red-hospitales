from django.contrib import admin
from django.urls import path, include
from citas.urls import urlpatterns as citas_urls, urls_medicos, urls_hospitales, urls_mensajes, urls_facturacion

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/citas/", include(citas_urls)),
    path("api/medicos/", include(urls_medicos)),
    path("api/hospitales/", include(urls_hospitales)),
    path("api/mensajes/", include(urls_mensajes)),
    path("api/facturacion/", include(urls_facturacion)),
]
