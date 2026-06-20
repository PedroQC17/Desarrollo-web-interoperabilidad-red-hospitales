from django.contrib import admin
from .models import Medicamento, Despacho, DespachoItem


@admin.register(Medicamento)
class MedicamentoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'hospital', 'tipo', 'stock', 'costo', 'activo')
    list_filter = ('tipo', 'hospital', 'activo')
    search_fields = ('nombre', 'descripcion')
    readonly_fields = ('id',)


class DespachoItemInline(admin.TabularInline):
    model = DespachoItem
    extra = 0
    readonly_fields = ('subtotal',)


@admin.register(Despacho)
class DespachoAdmin(admin.ModelAdmin):
    list_display = ('id', 'medico', 'cita', 'fecha_despacho', 'total')
    list_filter = ('fecha_despacho', 'medico')
    search_fields = ('cita__paciente__usuario__nombre', 'medico__usuario__nombre')
    readonly_fields = ('fecha_despacho', 'total', 'id')
    inlines = [DespachoItemInline]


@admin.register(DespachoItem)
class DespachoItemAdmin(admin.ModelAdmin):
    list_display = ('despacho', 'medicamento', 'cantidad', 'precio_unitario', 'subtotal')
    list_filter = ('despacho__fecha_despacho',)
    search_fields = ('medicamento__nombre',)
    readonly_fields = ('subtotal',)
