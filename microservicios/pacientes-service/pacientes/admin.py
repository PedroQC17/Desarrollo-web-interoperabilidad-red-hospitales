from django.contrib import admin

from .models import Paciente, Historial, Observacion, Examen, Receta, Diagnostico


@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    list_display = ["nombre", "email", "fecha_nacimiento"]
    search_fields = ["nombre", "email"]

@admin.register(Historial)
class HistorialAdmin(admin.ModelAdmin):
    list_display = ["paciente", "fecha_creacion"]
    list_filter = ["fecha_creacion"]

@admin.register(Observacion)
class ObservacionAdmin(admin.ModelAdmin):
    list_display = ["historial", "fecha"]

@admin.register(Examen)
class ExamenAdmin(admin.ModelAdmin):
    list_display = ["historial", "tipo", "fecha"]

@admin.register(Receta)
class RecetaAdmin(admin.ModelAdmin):
    list_display = ["historial", "medicamento_id", "categoria", "fecha_emitida"]

@admin.register(Diagnostico)
class DiagnosticoAdmin(admin.ModelAdmin):
    list_display = ["historial", "estado_clinico", "fecha_hora_inicio"]
