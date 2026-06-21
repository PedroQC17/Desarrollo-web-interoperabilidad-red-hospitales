from django.test import TestCase
from datetime import date
from rest_framework.test import APIClient
from rest_framework import status

from usuarios.models import Usuario, Medico, Administrador
from hospitales.models import Hospital


class HospitalModelTest(TestCase):
    def test_crear_hospital_campos_requeridos(self):
        hospital = Hospital.objects.create(
            tipo="publico",
            nombre="Hospital Nacional Daniel Alcides Carrión",
            contacto="01-3304001",
            especialidad="Medicina General",
            ubicacion="Av. Central 456 - Callao",
            periodo="Lun-Sab 8am-8pm",
        )
        hospital_bd = Hospital.objects.get(pk=hospital.id)
        self.assertEqual(hospital_bd.nombre, "Hospital Nacional Daniel Alcides Carrión")
        self.assertEqual(hospital_bd.tipo, "publico")
        self.assertTrue(hospital_bd.activo)


class HospitalAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.admin_user = Usuario.objects.create_user(
            email="rodrigo.morales@siehc.com", password="AdminSegura789!",
            nombre="Rodrigo Morales Sánchez", telecom="987654013",
            genero="M", fec_nac=date(1985, 5, 10), tipo_usuario="admin",
        )
        Administrador.objects.create(usuario=self.admin_user)

        self.medico_user = Usuario.objects.create_user(
            email="luis.fernandez@hospital.com", password="MedicoPass222!",
            nombre="Dr. Luis Fernández Castillo", telecom="987654014",
            genero="M", fec_nac=date(1976, 2, 14), tipo_usuario="medico",
        )
        self.hospital = Hospital.objects.create(
            tipo="publico", nombre="Hospital Nacional Cayetano Heredia",
            alias="HNCH", contacto="01-3820303",
            especialidad="Medicina Interna",
            ubicacion="Av. Honorio Delgado 262 - San Martín de Porres",
            periodo="Lun-Dom 24h", activo=True,
        )
        Medico.objects.create(
            usuario=self.medico_user, hospital=self.hospital,
            periodo="Lun-Vie 8am-4pm", especialidad="Medicina Interna",
            ubicacion="Consultorio 205 - Pabellón B",
            servicio_sanitario="Servicio de Medicina Interna",
            disponibilidad=True,
        )

    def test_post_hospital_como_admin_201(self):
        self.client.force_authenticate(user=self.admin_user)
        respuesta = self.client.post("/api/hospitales/hospitales/", {
            "tipo": "privado",
            "nombre": "Clínica Delgado",
            "contacto": "01-6196500",
            "especialidad": "Oncología",
            "ubicacion": "Av. Guardia Civil 429 - San Borja",
            "periodo": "Lun-Vie 7am-9pm",
        }, format="json")
        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(respuesta.data["nombre"], "Clínica Delgado")

    def test_post_hospital_como_medico_403(self):
        self.client.force_authenticate(user=self.medico_user)
        respuesta = self.client.post("/api/hospitales/hospitales/", {
            "tipo": "privado",
            "nombre": "Clínica Peruano Americana",
            "contacto": "01-5133001",
            "especialidad": "Traumatología",
            "ubicacion": "Av. Alfredo Salazar 350 - San Isidro",
            "periodo": "Lun-Vie 8am-8pm",
        }, format="json")
        self.assertEqual(respuesta.status_code, status.HTTP_403_FORBIDDEN)
