from django.contrib import admin
from .models import Medicamento, Despacho, DespachoItem


@admin.register(Medicamento)
class MedicamentoAdmin(admin.ModelAdmin):
    list_display = ["nombre", "tipo", "stock", "costo", "activo"]
    list_filter = ["tipo", "activo"]
    search_fields = ["nombre", "descripcion"]


class DespachoItemInline(admin.TabularInline):
    model = DespachoItem
    extra = 0
    readonly_fields = ["subtotal"]


@admin.register(Despacho)
class DespachoAdmin(admin.ModelAdmin):
    list_display = ["id", "medico_id", "cita_id", "fecha_despacho", "total"]
    readonly_fields = ["fecha_despacho", "total"]
    inlines = [DespachoItemInline]
