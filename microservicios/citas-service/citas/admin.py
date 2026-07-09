from django.contrib import admin
from .models import Cita, Hospital, Medico, Factura, Mensaje


@admin.register(Cita)
class CitaAdmin(admin.ModelAdmin):
    list_display = ["paciente_nombre", "medico_nombre", "especialidad", "estado", "inicio"]
    list_filter = ["estado", "especialidad"]
    search_fields = ["paciente_nombre", "medico_nombre"]


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ["nombre", "ubicacion", "activo", "creado_en"]
    list_filter = ["activo"]
    search_fields = ["nombre", "ubicacion"]


@admin.register(Medico)
class MedicoAdmin(admin.ModelAdmin):
    list_display = ["nombre", "especialidad", "disponibilidad", "hospital"]
    list_filter = ["especialidad", "disponibilidad"]
    search_fields = ["nombre", "email"]


@admin.register(Factura)
class FacturaAdmin(admin.ModelAdmin):
    list_display = ["paciente_nombre", "monto_total", "pagada", "fecha_emision"]
    list_filter = ["pagada"]


@admin.register(Mensaje)
class MensajeAdmin(admin.ModelAdmin):
    list_display = ["paciente_nombre", "enviado_por", "fecha_hora", "leido"]
    list_filter = ["enviado_por", "leido"]
