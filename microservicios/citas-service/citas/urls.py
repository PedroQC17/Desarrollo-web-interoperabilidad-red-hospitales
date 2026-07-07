from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health, name="health"),
    path("mis-citas/", views.mis_citas, name="mis-citas"),
    path("mis-citas-medico/", views.mis_citas_medico, name="mis-citas-medico"),
    path("medico/activas/", views.citas_medico_activas, name="citas-medico-activas"),
    path("reporte-servicios/", views.reporte_servicios, name="reporte-servicios"),
    path("", views.cita_list, name="cita-list"),
    path("<int:pk>/", views.cita_detail, name="cita-detail"),
    path("<int:pk>/detalle/", views.cita_detalle, name="cita-detalle"),
    path("<int:pk>/estado/", views.cambiar_estado, name="cambiar-estado"),
    path("<int:pk>/diagnostico/", views.cita_diagnostico, name="cita-diagnostico"),
    path("<int:pk>/receta/", views.cita_receta, name="cita-receta"),
    path("<int:pk>/resumen-pago/", views.cita_resumen_pago, name="cita-resumen-pago"),
    path("<int:pk>/pagar/", views.cita_pagar, name="cita-pagar"),
    path("<int:pk>/paciente/", views.cita_paciente, name="cita-paciente"),
]
