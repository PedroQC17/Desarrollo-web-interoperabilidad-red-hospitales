from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health, name="health"),
    path("mis-facturas/", views.mis_facturas, name="mis-facturas"),
    path("reporte-ingresos/", views.reporte_ingresos, name="reporte-ingresos"),
    path("", views.factura_list, name="factura-list"),
    path("<int:pk>/", views.factura_detail, name="factura-detail"),
    path("<int:pk>/pagar/", views.registrar_pago, name="registrar-pago"),
]
