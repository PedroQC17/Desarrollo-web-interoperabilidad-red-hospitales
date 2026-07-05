from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health, name="health"),
    path("", views.medicamento_list, name="medicamento-list"),
    path("<int:pk>/", views.medicamento_detail, name="medicamento-detail"),
    path("despachar/", views.despachar, name="despachar"),
    path("mis-despachos/", views.mis_despachos, name="mis-despachos"),
    path("mis-facturas/", views.mis_facturas, name="mis-facturas"),
]
