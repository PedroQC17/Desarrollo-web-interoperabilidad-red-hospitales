from datetime import date

from django.test import TestCase
from rest_framework.test import APIClient

from usuarios.models import Usuario, Paciente, Medico
from hospitales.models import Hospital


class HospitalesMedicosAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

        # paciente
        self.patient_user = Usuario.objects.create_user(
            email="patient@example.com",
            password="testpass",
            nombre="Paciente Test",
            telecom="999",
            genero="M",
            fec_nac=date(1990, 1, 1),
            tipo_usuario="paciente",
        )

        Paciente.objects.create(
            usuario=self.patient_user,
            direccion="Calle Falsa 123",
            estado_civil="soltero",
            contacto_nombre="Contacto",
            contacto_numero="999",
            contacto_dir="Calle Contacto",
            idioma_preferido="es",
        )

        # hospitales
        self.h1 = Hospital.objects.create(
            tipo="publico",
            nombre="Hospital A",
            alias="HA",
            descripcion="",
            contacto="999",
            especialidad="Cardiologia",
            ubicacion="Direccion A",
            periodo="Lun-Vie",
            activo=True,
        )

        self.h2 = Hospital.objects.create(
            tipo="privado",
            nombre="Hospital B",
            alias="HB",
            descripcion="",
            contacto="888",
            especialidad="Pediatria",
            ubicacion="Direccion B",
            periodo="Lun-Vie",
            activo=False,
        )

        # medico en h1
        self.med_user = Usuario.objects.create_user(
            email="med@example.com",
            password="testpass",
            nombre="Medico Test",
            telecom="777",
            genero="M",
            fec_nac=date(1980, 1, 1),
            tipo_usuario="medico",
        )

        self.medico = Medico.objects.create(
            usuario=self.med_user,
            hospital=self.h1,
            periodo="Lun-Vie 9-17",
            especialidad="Cardiologia",
            ubicacion="Consultorio 1",
            servicio_sanitario="SS",
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
