from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health, name="health"),
    path("mis-citas/", views.mis_citas, name="mis-citas"),
    path("", views.cita_list, name="cita-list"),
    path("<int:pk>/", views.cita_detail, name="cita-detail"),
    path("<int:pk>/estado/", views.cambiar_estado, name="cambiar-estado"),
]
