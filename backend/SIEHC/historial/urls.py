from django.urls import path
from rest_framework.routers import DefaultRouter
from historial.views import (
    # ViewSets (admin / CRUD)
    HistorialViewSet,
    ObservacionViewSet,
    ExamenViewSet,

    RecetaViewSet,
    DiagnosticoViewSet,
    # Vistas de negocio (Épica 2)
    MiHistorialView,
    SubirHistorialView,
    SubirHistorialPdfView,
    MisDiagnosticosView,
    MisRecetasView,
    ConsentimientoView,
    HistorialPacienteView,
)

from historial.views import (
    RegistrarDiagnosticoView,
    CrearRecetaView,
    DespacharMedicamentoView
)

# ── Router para ViewSets (CRUD admin) ─────────────────────────────────────────
router = DefaultRouter()
router.register(r'historiales',    HistorialViewSet)
router.register(r'observaciones',  ObservacionViewSet)
router.register(r'examenes',       ExamenViewSet)
router.register(r'recetas',        RecetaViewSet)
router.register(r'diagnosticos',   DiagnosticoViewSet)


# ── Rutas de negocio ──────────────────────────────────────────────────────────
urlpatterns = [
    #Subir / crear historial
    path('subir/',              SubirHistorialView.as_view(),    name='subir-historial'),
    path('subir-pdf/',          SubirHistorialPdfView.as_view(), name='subir-historial-pdf'),
 
    #Consultar historial completo (tabs Diagnósticos + Recetas)
    path('mi-historial/',       MiHistorialView.as_view(),       name='mi-historial'),
    path('mis-diagnosticos/',   MisDiagnosticosView.as_view(),   name='mis-diagnosticos'),
    path('mis-recetas/',        MisRecetasView.as_view(),        name='mis-recetas'),
 
    #Consentimiento informado
    path('consentimiento/',     ConsentimientoView.as_view(),    name='consentimiento'),
 
    # Médico accede al historial de un paciente (desde cita)
    path('paciente/<int:paciente_id>/', HistorialPacienteView.as_view(), name='historial-paciente'),

    #endopints para la atencion medica
    path('diagnosticos/<int:historial_id>/',RegistrarDiagnosticoView.as_view()),

    path('recetas/crear/', CrearRecetaView.as_view()),

    path('despachar/<int:receta_id>/',
    DespacharMedicamentoView.as_view()),

] + router.urls