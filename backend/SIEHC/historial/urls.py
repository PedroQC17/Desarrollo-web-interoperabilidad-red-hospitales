from rest_framework.routers import DefaultRouter
from historial.views import (
    HistorialViewSet,
    ObservacionViewSet,
    ExamenViewSet,
    RecetaViewSet,
    DiagnosticoViewSet
)

router = DefaultRouter()

router.register(r'historiales', HistorialViewSet)
router.register(r'observaciones', ObservacionViewSet)
router.register(r'examenes', ExamenViewSet)
router.register(r'recetas', RecetaViewSet)
router.register(r'diagnosticos', DiagnosticoViewSet)

urlpatterns = router.urls