from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/medicos/", include("medicos.urls")),
    path("api/hospitales/", include("medicos.hospital_urls")),
]
