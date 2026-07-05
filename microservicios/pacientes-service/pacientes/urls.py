from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health, name="health"),
    path("", views.paciente_list, name="paciente-list"),
    path("<int:pk>/", views.paciente_detail, name="paciente-detail"),
]
