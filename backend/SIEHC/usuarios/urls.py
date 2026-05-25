from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PacienteViewSet, MedicoViewSet, AdministradorViewSet, LoginView,RegisterView,ProfileView,UsuarioListView

from .views import toggle_activo

router = DefaultRouter()

router.register(r'pacientes', PacienteViewSet)
router.register(r'medicos', MedicoViewSet)
router.register(r'administradores', AdministradorViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('profile/',ProfileView.as_view()),
    path('admin/usuarios/', UsuarioListView.as_view()), 
    path('<int:pk>/toggle-activo/', toggle_activo),
]