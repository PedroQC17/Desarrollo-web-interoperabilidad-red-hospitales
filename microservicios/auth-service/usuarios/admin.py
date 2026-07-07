from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Usuario

@admin.register(Usuario)
class UsuarioAdmin(BaseUserAdmin):
    list_display = ["email", "nombre", "tipo_usuario", "is_staff", "is_active"]
    list_filter = ["tipo_usuario", "is_staff", "is_active"]
    search_fields = ["email", "nombre"]
    ordering = ["email"]
    fieldsets = (
        (None, {"fields": ("email", "nombre", "password")}),
        ("Tipo", {"fields": ("tipo_usuario",)}),
        ("Permisos", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Fechas", {"fields": ("fecha_registro",)}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "nombre", "tipo_usuario", "password1", "password2"),
        }),
    )
