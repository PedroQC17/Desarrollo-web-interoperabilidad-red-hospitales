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

    # Medicos (inline)
    path("hospitales/", views.hospitales_list, name="hospitales-list"),
    path("medicos-disponibles/", views.medicos_disponibles, name="medicos-disponibles"),
    path("disponibles/", views.medicos_disponibles, name="medicos-disponibles-alt"),
]

# URLs bajo /api/medicos/
urls_medicos = [
    path("registrar/", views.medico_registrar, name="medico-registrar"),
    path("hospitales/", views.hospitales_list, name="medicos-hospitales"),
    path("medicos-disponibles/", views.medicos_disponibles, name="medicos-disponibles-api"),
    path("disponibles/", views.medicos_disponibles, name="medicos-disponibles-alt"),
    path("", views.medico_list, name="medico-list"),
    path("<int:pk>/", views.medico_detail, name="medico-detail"),
    path("<int:pk>/toggle-disponibilidad/", views.toggle_disponibilidad, name="toggle-disponibilidad"),
]

# URLs bajo /api/hospitales/
urls_hospitales = [
    path("", views.hospital_list, name="hospital-list"),
    path("reporte/", views.hospital_reporte, name="hospital-reporte"),
    path("reporte_pdf/", views.hospital_reporte, name="hospital-reporte-pdf"),
    path("<int:pk>/", views.hospital_detail, name="hospital-detail"),
    path("<int:pk>/desafiliar/", views.hospital_desafiliar, name="hospital-desafiliar"),
]

# URLs bajo /api/mensajes/
urls_mensajes = [
    path("mensajes/", views.mensaje_list, name="mensaje-list"),
    path("mensajes/<int:pk>/", views.mensaje_detail, name="mensaje-detail"),
    path("mensajes/<int:pk>/marcar-leido/", views.marcar_leido, name="marcar-leido"),
]

# URLs bajo /api/facturacion/
urls_facturacion = [
    path("", views.factura_list, name="factura-list"),
    path("mis-facturas/", views.mis_facturas, name="mis-facturas"),
    path("reporte-ingresos/", views.reporte_ingresos, name="reporte-ingresos"),
    path("<int:pk>/", views.factura_detail, name="factura-detail"),
    path("<int:pk>/pagar/", views.registrar_pago, name="registrar-pago"),
]
