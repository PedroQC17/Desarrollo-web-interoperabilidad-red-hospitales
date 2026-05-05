from rest_framework.routers import DefaultRouter
from facturacion.views import FacturacionViewSet

router = DefaultRouter()
router.register(r'facturas', FacturacionViewSet)

urlpatterns = router.urls