from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HospitalViewSet

router = DefaultRouter()
router.register(r'hospitales', HospitalViewSet)

urlpatterns = [
    path('', include(router.urls)),
]