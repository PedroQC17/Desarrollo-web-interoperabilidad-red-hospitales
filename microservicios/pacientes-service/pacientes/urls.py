from django.urls import path

from . import views

# Rutas bajo /api/pacientes/
paciente_patterns = [
    path("health/", views.health, name="health"),
    path("", views.paciente_list, name="paciente-list"),
    path("<int:pk>/", views.paciente_detail, name="paciente-detail"),
]

# Rutas bajo /api/historiales/ (sin el prefijo "historiales/")
historial_patterns = [
    path("mi-historial/", views.mi_historial, name="mi-historial"),
    path("mis-diagnosticos/", views.mis_diagnosticos, name="mis-diagnosticos"),
    path("mis-recetas/", views.mis_recetas, name="mis-recetas"),
    path("diagnosticos/", views.diagnosticos_list, name="diagnosticos-list"),
    path("recetas/", views.recetas_list, name="recetas-list"),
    path("subir/", views.subir_historial, name="subir-historial"),
    path("subir-pdf/", views.subir_historial_pdf, name="subir-historial-pdf"),
    path("consentimiento/", views.consentimiento, name="consentimiento"),
    path("recetas/<int:pk>/pdf/", views.receta_pdf, name="receta-pdf"),
]

urlpatterns = paciente_patterns + historial_patterns

# Rutas bajo /api/recetas/
receta_patterns = [
    path("<int:pk>/pdf/", views.receta_pdf, name="receta-pdf"),
]
