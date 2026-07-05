from django.contrib import admin
from .models import Medico


@admin.register(Medico)
class MedicoAdmin(admin.ModelAdmin):
    list_display = ["nombre", "especialidad", "disponibilidad", "hospital_id"]
    list_filter = ["especialidad", "disponibilidad"]
    search_fields = ["nombre", "email"]
