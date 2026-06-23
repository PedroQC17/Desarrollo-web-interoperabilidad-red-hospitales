from datetime import date, timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from usuarios.models import Usuario, Paciente, Medico
from hospitales.models import Hospital
from services.gestion_pacientes.gestion_citas import solicitar_cita


class CitaServiceTest(TestCase):
    """Pruebas unitarias (sin API) para solicitar cita"""

    def setUp(self):
        self.paciente_user = Usuario.objects.create_user(email="laura@mail.com", password="Pass1234", nombre="Laura Torres", telecom="987654001", genero="F", fec_nac=date(1995, 7, 12), tipo_usuario="paciente")
        self.paciente = Paciente.objects.create(usuario=self.paciente_user)
        self.hospital = Hospital.objects.create(tipo="publico", nombre="Hospital Central", alias="HC", contacto="01-3304000", especialidad="Cardiología", ubicacion="Av. Central 123", periodo="Lun-Vie 8am-8pm", activo=True)
        self.medico_user = Usuario.objects.create_user(email="carlos@mail.com", password="Pass1234", nombre="Dr. Carlos García", telecom="987654003", genero="M", fec_nac=date(1975, 3, 20), tipo_usuario="medico")
        self.medico = Medico.objects.create(usuario=self.medico_user, hospital=self.hospital, periodo="Lun-Vie 9am-5pm", especialidad="Cardiología", ubicacion="Consultorio 305", servicio_sanitario="Cardiología", disponibilidad=True)

    def test_solicitar_cita_sin_medico_error(self):
        """CP-SC-VAL-01: Validar campos obligatorios (sin médico)"""
        with self.assertRaises(ValueError):
            solicitar_cita(self.paciente, {"medico": 999, "inicio": "2026-07-01T10:00:00Z", "fin": "2026-07-01T11:00:00Z"})

    def test_solicitar_cita_fecha_pasada_error(self):
        """CP-SC-VAL-02: Validar fecha y hora en pasado"""
        inicio_pasado = (timezone.now() - timedelta(days=1)).isoformat()
        fin_pasado = (timezone.now() - timedelta(days=1, hours=-1)).isoformat()
        with self.assertRaises(ValueError):
            solicitar_cita(self.paciente, {"medico": self.medico.id, "inicio": inicio_pasado, "fin": fin_pasado})

    def test_solicitar_cita_presencial_exitosa(self):
        """CP-SC-VAL-03: Solicitud exitosa de cita presencial"""
        inicio = (timezone.now() + timedelta(days=1)).isoformat()
        fin = (timezone.now() + timedelta(days=1, hours=1)).isoformat()
        cita = solicitar_cita(self.paciente, {"medico": self.medico.id, "hospital": self.hospital.id, "tipo": "presencial", "inicio": inicio, "fin": fin, "categoria_servicio": "consulta_general"})
        self.assertIsNotNone(cita)
        self.assertEqual(cita.estado, "pendiente")
        self.assertEqual(cita.tipo, "presencial")

    def test_solicitar_cita_virtual_exitosa(self):
        """CP-SC-VAL-04: Solicitud exitosa de cita virtual"""
        inicio = (timezone.now() + timedelta(days=2)).isoformat()
        fin = (timezone.now() + timedelta(days=2, hours=1)).isoformat()
        cita = solicitar_cita(self.paciente, {"medico": self.medico.id, "hospital": self.hospital.id, "tipo": "virtual", "inicio": inicio, "fin": fin, "categoria_servicio": "teleconsulta"})
        self.assertIsNotNone(cita)
        self.assertEqual(cita.estado, "pendiente")
        self.assertEqual(cita.tipo, "virtual")


class CitaAPITest(TestCase):
    """Pruebas de API para solicitar cita"""

    def setUp(self):
        self.client = APIClient()
        self.patient_user = Usuario.objects.create_user(email="ana@mail.com", password="Pass1234", nombre="Ana Martínez", telecom="987654007", genero="F", fec_nac=date(1998, 9, 25), tipo_usuario="paciente")
        Paciente.objects.create(usuario=self.patient_user)
        self.hospital = Hospital.objects.create(tipo="privado", nombre="Clínica Salud", alias="CS", contacto="01-5133000", especialidad="Medicina General", ubicacion="Av. Salud 350", periodo="Lun-Vie 7am-9pm", activo=True)
        self.med_user = Usuario.objects.create_user(email="fernando@mail.com", password="Pass1234", nombre="Dr. Fernando Salas", telecom="987654009", genero="M", fec_nac=date(1978, 11, 8), tipo_usuario="medico")
        self.medico = Medico.objects.create(usuario=self.med_user, hospital=self.hospital, periodo="Lun-Vie 10am-6pm", especialidad="Medicina General", ubicacion="Consultorio 402", servicio_sanitario="Medicina", disponibilidad=True)

    def test_post_solicitar_cita_sin_medico_400(self):
        """CP-SC-VAL-01: Validar hospital/médico no seleccionado → 400"""
        self.client.force_authenticate(user=self.patient_user)
        respuesta = self.client.post("/api/citas/solicitar/", {"medico": 999, "inicio": "2026-07-01T10:00:00Z", "fin": "2026-07-01T11:00:00Z"}, format="json")
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_post_solicitar_cita_fecha_pasada_400(self):
        """CP-SC-VAL-02: Validar fecha en pasado → 400"""
        self.client.force_authenticate(user=self.patient_user)
        inicio = (timezone.now() - timedelta(days=1)).isoformat()
        fin = (timezone.now() - timedelta(days=1, hours=-1)).isoformat()
        respuesta = self.client.post("/api/citas/solicitar/", {"medico": self.medico.id, "inicio": inicio, "fin": fin, "tipo": "presencial"}, format="json")
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_post_solicitar_cita_presencial_201(self):
        """CP-SC-VAL-03: Solicitud exitosa de cita presencial → 201"""
        self.client.force_authenticate(user=self.patient_user)
        inicio = (timezone.now() + timedelta(days=1)).isoformat()
        fin = (timezone.now() + timedelta(days=1, hours=1)).isoformat()
        respuesta = self.client.post("/api/citas/solicitar/", {"medico": self.medico.id, "hospital": self.hospital.id, "tipo": "presencial", "inicio": inicio, "fin": fin, "categoria_servicio": "consulta_general"}, format="json")
        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(respuesta.data["cita"]["estado"], "pendiente")
        self.assertEqual(respuesta.data["cita"]["tipo"], "presencial")

    def test_post_solicitar_cita_virtual_201(self):
        """CP-SC-VAL-04: Solicitud exitosa de cita virtual → 201"""
        self.client.force_authenticate(user=self.patient_user)
        inicio = (timezone.now() + timedelta(days=2)).isoformat()
        fin = (timezone.now() + timedelta(days=2, hours=1)).isoformat()
        respuesta = self.client.post("/api/citas/solicitar/", {"medico": self.medico.id, "hospital": self.hospital.id, "tipo": "virtual", "inicio": inicio, "fin": fin, "categoria_servicio": "teleconsulta"}, format="json")
        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(respuesta.data["cita"]["estado"], "pendiente")
        self.assertEqual(respuesta.data["cita"]["tipo"], "virtual")
