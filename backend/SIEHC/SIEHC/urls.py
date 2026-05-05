from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # 🔹 APIs
    path('api/usuarios/', include('usuarios.urls')),
    path('api/hospitales/', include('hospitales.urls')),
    path('api/medicamentos/', include('medicamentos.urls')),
    path('api/mensajes/', include('soporte.urls')),
    path('api/historiales/', include('historial.urls')),
    path('api/facturacion/', include('facturacion.urls')),
    path('api/citas/', include('citas.urls')),
]

"""
GET    /api/citas/citas/
POST   /api/citas/citas/
GET    /api/citas/citas/{id}/
PUT    /api/citas/citas/{id}/
DELETE /api/citas/citas/{id}/
{
  "medico": 1,
  "paciente": 1,
  "tipo": "presencial",
  "categoria_servicio": "Consulta general",
  "especialidad": "Medicina",
  "prioridad": "normal",
  "estado": "pendiente",
  "inicio": "2026-05-10T10:00:00Z",
  "fin": "2026-05-10T10:30:00Z",
  "nota": "Dolor de cabeza",
  "costo_servicio": 50.00
}
"""

'''
GET    /api/facturacion/facturas/
POST   /api/facturacion/facturas/
GET    /api/facturacion/facturas/{id}/
PUT    /api/facturacion/facturas/{id}/
DELETE /api/facturacion/facturas/{id}/

{
  "cita": 1,
  "descripcion": "Consulta médica general",
  "monto_total": 80.50
}

'''