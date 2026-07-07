from django.contrib import admin
from .models import Medico, Hospital


@admin.register(Medico)
class MedicoAdmin(admin.ModelAdmin):
    list_display = ["nombre", "especialidad", "disponibilidad", "hospital_id"]
    list_filter = ["especialidad", "disponibilidad"]
    search_fields = ["nombre", "email"]


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ["nombre", "ubicacion", "activo", "creado_en"]
    list_filter = ["activo"]
    search_fields = ["nombre", "ubicacion"]
