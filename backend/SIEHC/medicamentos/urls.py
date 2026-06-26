from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    MedicamentoViewSet,
    CatalogoMedicamentosView,
    DespacharMedicamentosView,
    MisDespachoView,
    MisFacturasMedicamentosView,
    ReporteVentasMedicamentosView,
)

router = DefaultRouter()
router.register(r"medicamentos", MedicamentoViewSet, basename="medicamento")

urlpatterns = [

    # ── HU11 — Catálogo paginado para el médico y paciente ────────────────
    path("catalogo/",                      CatalogoMedicamentosView.as_view(),  name="catalogo-medicamentos"),

    # ── HU12 — Despacho de medicamentos por cita ─────────────────────────────
    path("despachar/<int:cita_pk>/", DespacharMedicamentosView.as_view(), name="despachar-medicamentos"),
    path("medicamentos/despachar/<int:cita_pk>/", DespacharMedicamentosView.as_view(), name="despachar-medicamentos-alt"),

    # ── HU17 — Reporte de ventas de medicamentos (admin) ───────────────────────
    path("reporte-ventas/",                  ReporteVentasMedicamentosView.as_view(), name="reporte-ventas-medicamentos"),

    # ── HU12+ — Listar despachos del médico ────────────────────────────────────
    path("mis-despachos/",                 MisDespachoView.as_view(), name="mis-despachos"),

    # ── Paciente — Listar facturas de medicamentos ─────────────────────────────
    path("mis-facturas-medicamentos/",     MisFacturasMedicamentosView.as_view(), name="mis-facturas-medicamentos"),

    # ── CRUD admin (router existente) ─────────────────────────────────────────
    path("", include(router.urls)),
]