from django.contrib import admin
from .models import Mensaje


@admin.register(Mensaje)
class MensajeAdmin(admin.ModelAdmin):
    list_display = ["id", "paciente_nombre", "enviado_por", "leido", "fecha_hora"]
    list_filter = ["enviado_por", "leido"]
    search_fields = ["contenido"]
