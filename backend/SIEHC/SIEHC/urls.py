from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    #  APIs
    path('api/usuarios/', include('usuarios.urls')),
    path('api/hospitales/', include('hospitales.urls')),
    path('api/medicamentos/', include('medicamentos.urls')),
    path('api/mensajes/', include('soporte.urls')),
    path('api/historiales/', include('historial.urls')),
    path('api/facturacion/', include('facturacion.urls')),
    path('api/citas/', include('citas.urls')),
]

