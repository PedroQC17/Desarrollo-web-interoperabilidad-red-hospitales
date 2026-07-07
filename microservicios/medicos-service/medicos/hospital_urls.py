from django.urls import path

from . import views

urlpatterns = [
    path("", views.hospital_list, name="hospital-list"),
    path("reporte/", views.hospital_reporte, name="hospital-reporte"),
    path("reporte_pdf/", views.hospital_reporte, name="hospital-reporte-pdf"),
    path("<int:pk>/", views.hospital_detail, name="hospital-detail"),
    path("<int:pk>/desafiliar/", views.hospital_desafiliar, name="hospital-desafiliar"),
]
