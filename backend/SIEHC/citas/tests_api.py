from datetime import date, timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from usuarios.models import Usuario, Paciente, Medico
from hospitales.models import Hospital


class HospitalesMedicosAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.patient_user = Usuario.objects.create_user(
            email="pedro.gutierrez@hospital.com", password="PedroPass456!",
            nombre="Pedro Gutiérrez Ríos", telecom="987654010",
            genero="M", fec_nac=date(1992, 4, 18), tipo_usuario="paciente",
        )

        Paciente.objects.create(
            usuario=self.patient_user,
            direccion="Jr. Las Magnolias 789 - Surco", estado_civil="soltero",
            contacto_nombre="Lucía Gutiérrez", contacto_numero="987654011",
            contacto_dir="Jr. Las Magnolias 789", idioma_preferido="es",
        )

        self.h1 = Hospital.objects.create(
            tipo="publico", nombre="Hospital Nacional Dos de Mayo",
            alias="HNDM", contacto="01-3115000",
            especialidad="Medicina General",
            ubicacion="Av. Miguel Grau 500 - Cercado de Lima",
            periodo="Lun-Dom 24h", activo=True,
        )

        self.h2 = Hospital.objects.create(
            tipo="privado", nombre="Clínica San Pablo",
            alias="CSP", contacto="01-2196000",
            especialidad="Pediatría",
            ubicacion="Av. La Molina 1255 - La Molina",
            periodo="Lun-Vie 8am-8pm", activo=False,
        )

        self.med_user = Usuario.objects.create_user(
            email="jorge.astocondor@hospital.com", password="MedicoPass111!",
            nombre="Dr. Jorge Astocóndor Alarcón", telecom="987654012",
            genero="M", fec_nac=date(1972, 8, 30), tipo_usuario="medico",
        )

        self.medico = Medico.objects.create(
            usuario=self.med_user, hospital=self.h1,
            periodo="Lun-Vie 8am-2pm", especialidad="Cardiología",
            ubicacion="Consultorio 110 - Pabellón Principal",
            servicio_sanitario="Servicio de Cardiología",
            disponibilidad=True,
        )

    def test_hospitales_list_accessible_and_returns_active(self):
        """Verifica que el endpoint de hospitales devuelve hospitales activos y datos esperados."""
        self.client.force_authenticate(user=self.patient_user)

        # Endpoint administrable por router (lista real)
        resp = self.client.get("/api/hospitales/hospitales/")
        self.assertEqual(resp.status_code, 200, msg=resp.content)
        data = resp.json()
        # puede ser lista o paginado; buscar por nombre
        items = data.get("results", data) if isinstance(data, dict) else data
        nombres = [i.get("nombre") for i in items]
        self.assertIn(self.h1.nombre, nombres)
        self.assertNotIn(self.h2.nombre, nombres, msg="Hospital inactivo no debe aparecer sin filtro activo")

    def test_medicos_disponibles_returns_medico_for_hospital(self):
        """Verifica que medicos-disponibles devuelve el médico asociado al hospital."""
        self.client.force_authenticate(user=self.patient_user)

        resp = self.client.get(f"/api/citas/medicos-disponibles/?hospital={self.h1.id}")
        self.assertEqual(resp.status_code, 200, msg=resp.content)
        data = resp.json()
        # esperamos lista de médicos disponibles
        self.assertIsInstance(data, list)
        # buscar por id y especialidad
        found = False
        for m in data:
            if int(m.get("id")) == self.medico.id:
                found = True
                self.assertEqual(m.get("hospital_id"), self.h1.id)
                self.assertEqual(m.get("especialidad"), self.medico.especialidad)
        self.assertTrue(found, msg="El médico creado no fue retornado por medicos-disponibles")


class CitaAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.patient_user = Usuario.objects.create_user(
            email="sofia.vargas@hospital.com", password="SofiaPass789!",
            nombre="Sofía Vargas Luna", telecom="987654007",
            genero="F", fec_nac=date(1998, 9, 25), tipo_usuario="paciente",
        )
        Paciente.objects.create(
            usuario=self.patient_user,
            direccion="Av. La Marina 1234 - San Miguel", estado_civil="soltera",
            contacto_nombre="Roberto Vargas", contacto_numero="987654008",
            contacto_dir="Av. La Marina 1234", idioma_preferido="es",
        )

        self.hospital = Hospital.objects.create(
            tipo="privado", nombre="Clínica Anglo Americana",
            alias="CAA", contacto="01-5133000",
            especialidad="Cardiología",
            ubicacion="Av. Alfredo Salazar 350 - San Isidro",
            periodo="Lun-Vie 7am-9pm", activo=True,
        )

        self.med_user = Usuario.objects.create_user(
            email="fernando.salas@hospital.com", password="MedicoPass555!",
            nombre="Dr. Fernando Salas Guerrero", telecom="987654009",
            genero="M", fec_nac=date(1978, 11, 8), tipo_usuario="medico",
        )
        self.medico = Medico.objects.create(
            usuario=self.med_user, hospital=self.hospital,
            periodo="Lun-Vie 10am-6pm", especialidad="Cardiología",
            ubicacion="Consultorio 402 - Torre Médica",
            servicio_sanitario="Servicio de Cardiología",
            disponibilidad=True,
        )

    def test_post_solicitar_cita_201(self):
        self.client.force_authenticate(user=self.patient_user)
        inicio = timezone.now() + timedelta(days=1)
        fin = inicio + timedelta(hours=1)
        respuesta = self.client.post("/api/citas/solicitar/", {
            "medico": self.medico.id,
            "hospital": self.hospital.id,
            "tipo": "presencial",
            "inicio": inicio.isoformat(),
            "fin": fin.isoformat(),
        }, format="json")
        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        self.assertIn("cita", respuesta.data)
        self.assertEqual(respuesta.data["cita"]["estado"], "pendiente")

    def test_post_solicitar_cita_como_medico_403(self):
        self.client.force_authenticate(user=self.med_user)
        inicio = timezone.now() + timedelta(days=1)
        fin = inicio + timedelta(hours=1)
        respuesta = self.client.post("/api/citas/solicitar/", {
            "medico": self.medico.id,
            "hospital": self.hospital.id,
            "tipo": "presencial",
            "inicio": inicio.isoformat(),
            "fin": fin.isoformat(),
        }, format="json")
        self.assertEqual(respuesta.status_code, status.HTTP_403_FORBIDDEN)
