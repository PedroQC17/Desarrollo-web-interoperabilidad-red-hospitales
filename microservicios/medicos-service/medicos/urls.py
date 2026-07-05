from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health, name="health"),
    path("disponibles/", views.medicos_disponibles, name="medicos-disponibles"),
    path("", views.medico_list, name="medico-list"),
    path("<int:pk>/", views.medico_detail, name="medico-detail"),
    path("<int:pk>/toggle-disponibilidad/", views.toggle_disponibilidad, name="toggle-disponibilidad"),
]
