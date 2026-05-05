from rest_framework.routers import DefaultRouter
from citas.views import CitaViewSet

router = DefaultRouter()
router.register(r'citas', CitaViewSet)

urlpatterns = router.urls