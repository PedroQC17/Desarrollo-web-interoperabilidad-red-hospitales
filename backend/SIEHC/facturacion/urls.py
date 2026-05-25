from django.urls import path
from rest_framework.routers import DefaultRouter
from facturacion.views import FacturacionViewSet, GenerarPagoView
 
router = DefaultRouter()
router.register(r'', FacturacionViewSet, basename='facturacion')
#                ↑ antes era 'facturas', ahora es '' para que quede en /api/facturacion/
 
urlpatterns = [
    path('registrar/', GenerarPagoView.as_view(), name='generar-pago'),
    #     ↑ movemos el POST a /api/facturacion/registrar/
    #       para no chocar con el GET del ViewSet en /api/facturacion/
] + router.urls
 