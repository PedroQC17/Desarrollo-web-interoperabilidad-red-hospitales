from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health, name="health"),
    path("mensajes/", views.mensaje_list, name="mensaje-list"),
    path("mensajes/<int:pk>/", views.mensaje_detail, name="mensaje-detail"),
    path("mensajes/<int:pk>/marcar-leido/", views.marcar_leido, name="marcar-leido"),
]
