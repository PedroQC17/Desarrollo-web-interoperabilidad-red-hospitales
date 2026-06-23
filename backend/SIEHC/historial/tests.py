from datetime import date, timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from usuarios.models import Usuario, Paciente, Medico
from hospitales.models import Hospital
from citas.models import Cita
from services.gestion_medicos.gestion_atencion import registrar_diagnostico


class DiagnosticoServiceTest(TestCase):
    """Pruebas unitarias (sin API) para registrar diagnóstico"""

    def setUp(self):
        self.medico_user = Usuario.objects.create_user(email="medico@mail.com", password="Pass1234", nombre="Dr. López", telecom="987654001", genero="M", fec_nac=date(1975, 3, 20), tipo_usuario="medico")
        hospital = Hospital.objects.create(tipo="publico", nombre="Hospital Central", alias="HC", contacto="01-3304000", especialidad="Cardiología", ubicacion="Av. Central 123", periodo="Lun-Vie 8am-8pm", activo=True)
        self.medico = Medico.objects.create(usuario=self.medico_user, hospital=hospital, periodo="Lun-Vie 9am-5pm", especialidad="Cardiología", ubicacion="Consultorio 305", servicio_sanitario="Cardiología", disponibilidad=True)
        self.paciente_user = Usuario.objects.create_user(email="paciente@mail.com", password="Pass1234", nombre="Juan Pérez", telecom="987654002", genero="M", fec_nac=date(1990, 5, 15), tipo_usuario="paciente")
        self.paciente = Paciente.objects.create(usuario=self.paciente_user)
        inicio = timezone.now() + timedelta(hours=1)
        self.cita = Cita.objects.create(medico=self.medico, paciente=self.paciente, tipo="presencial", especialidad="Cardiología", estado="confirmada", inicio=inicio, fin=inicio + timedelta(hours=1))

    def test_registrar_diagnostico_campos_vacios_error(self):
        """CP-RD-VAL-01: Validar campos obligatorios vacíos"""
        with self.assertRaises(ValueError):
            registrar_diagnostico(self.medico, self.cita.id, {"estado_clinico": "", "categoria": "", "severidad": "", "ubicacion_anatomica": "", "fecha_hora_inicio": "", "edad_inicio": "", "descripcion_inicio": ""})

    def test_registrar_diagnostico_severidad_invalida_error(self):
        """CP-RD-VAL-02: Validar severidad fuera de rango"""
        with self.assertRaises(ValueError):
            registrar_diagnostico(self.medico, self.cita.id, {"estado_clinico": "Hipertensión", "categoria": "Cardiovascular", "severidad": "invalida", "ubicacion_anatomica": "Corazón", "fecha_hora_inicio": timezone.now(), "edad_inicio": 45, "descripcion_inicio": "Presión elevada"})

    def test_registrar_diagnostico_cita_inexistente_error(self):
        """CP-RD-VAL-03: Validar diagnóstico con cita inexistente"""
        with self.assertRaises(ValueError):
            registrar_diagnostico(self.medico, 9999, {"estado_clinico": "Hipertensión", "categoria": "Cardiovascular", "severidad": "moderado", "ubicacion_anatomica": "Corazón", "fecha_hora_inicio": timezone.now(), "edad_inicio": 45, "descripcion_inicio": "Presión elevada"})

    def test_registrar_diagnostico_exitoso_con_avance_estado(self):
        """CP-RD-VAL-04: Registro exitoso con avance de estado"""
        diagnostico = registrar_diagnostico(self.medico, self.cita.id, {"estado_clinico": "Hipertensión arterial", "categoria": "crónico", "severidad": "grave", "ubicacion_anatomica": "Sistema cardiovascular", "fecha_hora_inicio": timezone.now(), "edad_inicio": 45, "descripcion_inicio": "Paciente presenta presión arterial elevada"})
        self.assertIsNotNone(diagnostico)
        self.assertEqual(diagnostico.estado_clinico, "Hipertensión arterial")
        self.cita.refresh_from_db()
        self.assertEqual(self.cita.estado, "en_curso")


class DiagnosticoAPITest(TestCase):
    """Pruebas de API para registrar diagnóstico"""

    def setUp(self):
        self.client = APIClient()
        self.medico_user = Usuario.objects.create_user(email="medico2@mail.com", password="Pass1234", nombre="Dr. García", telecom="987654003", genero="M", fec_nac=date(1970, 8, 10), tipo_usuario="medico")
        hospital = Hospital.objects.create(tipo="privado", nombre="Clínica Salud", alias="CS", contacto="01-5133000", especialidad="Medicina General", ubicacion="Av. Salud 350", periodo="Lun-Vie 7am-9pm", activo=True)
        self.medico = Medico.objects.create(usuario=self.medico_user, hospital=hospital, periodo="Lun-Vie 10am-6pm", especialidad="Medicina General", ubicacion="Consultorio 402", servicio_sanitario="Medicina", disponibilidad=True)
        self.paciente_user = Usuario.objects.create_user(email="paciente2@mail.com", password="Pass1234", nombre="Ana Torres", telecom="987654004", genero="F", fec_nac=date(1995, 3, 22), tipo_usuario="paciente")
        Paciente.objects.create(usuario=self.paciente_user)
        inicio = timezone.now() + timedelta(hours=1)
        self.cita = Cita.objects.create(medico=self.medico, paciente=Paciente.objects.get(usuario=self.paciente_user), tipo="presencial", especialidad="Medicina General", estado="confirmada", inicio=inicio, fin=inicio + timedelta(hours=1))

    def test_post_diagnostico_campos_vacios_400(self):
        """CP-RD-VAL-01: Campos obligatorios vacíos → 400"""
        self.client.force_authenticate(user=self.medico_user)
        respuesta = self.client.post(f"/api/citas/{self.cita.id}/diagnostico/", {"estado_clinico": "", "categoria": "", "severidad": "", "ubicacion_anatomica": "", "fecha_hora_inicio": "", "edad_inicio": "", "descripcion_inicio": ""}, format="json")
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_post_diagnostico_severidad_invalida_400(self):
        """CP-RD-VAL-02: Severidad inválida → 400"""
        self.client.force_authenticate(user=self.medico_user)
        respuesta = self.client.post(f"/api/citas/{self.cita.id}/diagnostico/", {"estado_clinico": "Hipertensión", "categoria": "Cardiovascular", "severidad": "invalida", "ubicacion_anatomica": "Corazón", "fecha_hora_inicio": timezone.now().isoformat(), "edad_inicio": 45, "descripcion_inicio": "Presión elevada"}, format="json")
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_post_diagnostico_cita_inexistente_400(self):
        """CP-RD-VAL-03: Cita inexistente → 400"""
        self.client.force_authenticate(user=self.medico_user)
        respuesta = self.client.post("/api/citas/9999/diagnostico/", {"estado_clinico": "Hipertensión", "categoria": "Cardiovascular", "severidad": "moderado", "ubicacion_anatomica": "Corazón", "fecha_hora_inicio": timezone.now().isoformat(), "edad_inicio": 45, "descripcion_inicio": "Presión elevada"}, format="json")
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_post_diagnostico_exitoso_201(self):
        """CP-RD-VAL-04: Registro exitoso de diagnóstico → 201"""
        self.client.force_authenticate(user=self.medico_user)
        respuesta = self.client.post(f"/api/citas/{self.cita.id}/diagnostico/", {"estado_clinico": "Hipertensión arterial", "categoria": "crónico", "severidad": "grave", "ubicacion_anatomica": "Sistema cardiovascular", "fecha_hora_inicio": timezone.now().isoformat(), "edad_inicio": 45, "descripcion_inicio": "Paciente presenta presión arterial elevada de forma crónica"}, format="json")
        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        self.assertIn("diagnostico", respuesta.data)
        self.assertEqual(respuesta.data["diagnostico"]["estado_clinico"], "Hipertensión arterial")
