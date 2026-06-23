from django.urls import path
from rest_framework.routers import DefaultRouter

from citas.views import (
    # Épica 3 — Gestión de citas
    SolicitarCitaView,
    MedicosDisponiblesView,
    MisCitasView,
    CancelarCitaView,
    MisCitasMedicoView,
    CitasActivasMedicoView,
    CambiarEstadoCitaView,
    DetalleCitaView,
    # Épica 4 — Atención médica (vistas que operan sobre una cita)
    PacienteDeCitaView,
    DiagnosticoCitaView,
    RecetaCitaView,
    ResumenPagoView,
    RegistrarPagoView,
    # Admin
    CitaViewSet,
    ReporteServiciosView,
)

router = DefaultRouter()
router.register(r"citas", CitaViewSet, basename="cita-admin")

urlpatterns = [

    # ── HU06 — Paciente: agendar ────────────────────────────────────────────
    path("solicitar/",            SolicitarCitaView.as_view(),    name="solicitar-cita"),
    path("medicos-disponibles/",  MedicosDisponiblesView.as_view(),name="medicos-disponibles"),

    # ── HU07 — Paciente: consultar y cancelar ───────────────────────────────
    path("mis-citas/",            MisCitasView.as_view(),         name="mis-citas"),
    path("<int:pk>/cancelar/",    CancelarCitaView.as_view(),     name="cancelar-cita"),

    # ── HU08 — Médico: ver citas, cambiar estado, ver historial paciente ────
    path("mis-citas-medico/",     MisCitasMedicoView.as_view(),   name="mis-citas-medico"),
    path("medico/activas/",       CitasActivasMedicoView.as_view(),name="citas-activas-medico"),
    path("<int:pk>/estado/",      CambiarEstadoCitaView.as_view(),name="cambiar-estado-cita"),
    path("<int:pk>/paciente/",    PacienteDeCitaView.as_view(),   name="paciente-de-cita"),

    # ── Detalle (paciente o médico) ──────────────────────────────────────────
    path("<int:pk>/detalle/",     DetalleCitaView.as_view(),      name="detalle-cita"),

    # ── HU09 — Diagnóstico ──────────────────────────────────────────────────
    path("<int:pk>/diagnostico/", DiagnosticoCitaView.as_view(),  name="diagnostico-cita"),

    # ── HU10 — Receta ────────────────────────────────────────────────────────
    path("<int:pk>/receta/",      RecetaCitaView.as_view(),       name="receta-cita"),

    # ── HU13 — Pago ──────────────────────────────────────────────────────────
    path("<int:pk>/resumen-pago/",ResumenPagoView.as_view(),      name="resumen-pago"),
    path("<int:pk>/pagar/",       RegistrarPagoView.as_view(),    name="registrar-pago"),

    # ── HU18 — Reporte de utilidades por servicios médicos (admin) ─────────────
    path("reporte-servicios/",    ReporteServiciosView.as_view(), name="reporte-servicios"),

] + router.urls