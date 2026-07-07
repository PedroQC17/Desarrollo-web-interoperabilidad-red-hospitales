from django.contrib import admin
from django.urls import path, include
from pacientes.urls import paciente_patterns, historial_patterns, receta_patterns

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/pacientes/", include(paciente_patterns)),
    path("api/historiales/", include(historial_patterns)),
    path("api/recetas/", include(receta_patterns)),
]
