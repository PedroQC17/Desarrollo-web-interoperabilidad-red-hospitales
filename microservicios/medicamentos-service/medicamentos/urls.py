from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health, name="health"),
    path("", views.medicamento_list, name="medicamento-list"),
    path("buscar/", views.buscar_medicamento, name="buscar-medicamento"),
    path("catalogo/", views.catalogo, name="catalogo"),
    path("reporte-ventas/", views.reporte_ventas, name="reporte-ventas"),
    path("mis-facturas/", views.mis_facturas, name="mis-facturas"),
    path("mis-facturas-medicamentos/", views.mis_facturas_medicamentos, name="mis-facturas-medicamentos"),
    path("despachar/", views.despachar, name="despachar"),
    path("despachar/<int:cita_pk>/", views.despachar, name="despachar-cita"),
    path("despacho/<int:pk>/pdf/", views.despacho_pdf, name="despacho-pdf"),
    path("mis-despachos/", views.mis_despachos, name="mis-despachos"),
    path("<int:pk>/", views.medicamento_detail, name="medicamento-detail"),
]
