from django.test import TestCase
from django.utils import timezone
from datetime import date, timedelta

from usuarios.models import Usuario, Paciente, Medico
from hospitales.models import Hospital
from citas.models import Cita
from services.gestion_pacientes.gestion_citas import solicitar_cita


class CitaModelTest(TestCase):
    def setUp(self):
        self.paciente_user = Usuario.objects.create_user(
            email="laura.torres@hospital.com", password="LauraPass123!",
            nombre="Laura Torres Mendoza", telecom="987654001",
            genero="F", fec_nac=date(1995, 7, 12), tipo_usuario="paciente",
        )
        self.paciente = Paciente.objects.create(
            usuario=self.paciente_user,
            direccion="Jr. Los Olivos 456 - San Isidro", estado_civil="soltera",
            contacto_nombre="Pedro Torres", contacto_numero="987654002",
            contacto_dir="Jr. Los Olivos 456", idioma_preferido="es",
        )
        self.hospital = Hospital.objects.create(
            tipo="publico", nombre="Hospital Nacional Arzobispo Loayza",
            alias="HNAL", contacto="01-3304000",
            especialidad="Cardiología", ubicacion="Av. Alfonso Ugarte 848 - Lima",
            periodo="Lun-Vie 8am-8pm", activo=True,
        )
        self.medico_user = Usuario.objects.create_user(
            email="carlos.ramirez@hospital.com", password="MedicoPass456!",
            nombre="Dr. Carlos Ramírez Soto", telecom="987654003",
            genero="M", fec_nac=date(1975, 3, 20), tipo_usuario="medico",
        )
        self.medico = Medico.objects.create(
            usuario=self.medico_user, hospital=self.hospital,
            periodo="Lun-Vie 9am-5pm", especialidad="Cardiología",
            ubicacion="Consultorio 305 - Pabellón B",
            servicio_sanitario="Servicio de Cardiología",
            disponibilidad=True,
        )

    def test_crear_cita_con_estado_pendiente(self):
        inicio = timezone.now() + timedelta(days=1)
        fin = inicio + timedelta(hours=1)
        cita = Cita.objects.create(
            medico=self.medico, paciente=self.paciente,
            tipo="presencial", especialidad="Cardiología",
            inicio=inicio, fin=fin,
        )
        self.assertEqual(cita.estado, "pendiente")
        self.assertEqual(cita.tipo, "presencial")


class CitaServiceTest(TestCase):
    def setUp(self):
        self.paciente_user = Usuario.objects.create_user(
            email="miguel.quispe@hospital.com", password="PacientePass789!",
            nombre="Miguel Quispe Huamán", telecom="987654004",
            genero="M", fec_nac=date(1990, 11, 5), tipo_usuario="paciente",
        )
        self.paciente = Paciente.objects.create(
            usuario=self.paciente_user,
            direccion="Av. Brasil 234 - Jesús María", estado_civil="casado",
            contacto_nombre="Sofía Quispe", contacto_numero="987654005",
            contacto_dir="Av. Brasil 234", idioma_preferido="es",
        )
        self.hospital = Hospital.objects.create(
            tipo="publico", nombre="Hospital Nacional Guillermo Almenara",
            alias="HNGA", contacto="01-2655000",
            especialidad="Medicina Interna",
            ubicacion="Av. Grau 800 - La Victoria",
            periodo="Lun-Dom 24h", activo=True,
        )
        self.medico_user = Usuario.objects.create_user(
            email="elena.mendoza@hospital.com", password="MedicaPass321!",
            nombre="Dra. Elena Mendoza Paredes", telecom="987654006",
            genero="F", fec_nac=date(1982, 6, 15), tipo_usuario="medico",
        )
        self.medico = Medico.objects.create(
            usuario=self.medico_user, hospital=self.hospital,
            periodo="Lun-Vie 8am-4pm", especialidad="Medicina Interna",
            ubicacion="Consultorio 210 - Pabellón A",
            servicio_sanitario="Servicio de Medicina Interna",
            disponibilidad=True,
        )

    def test_solicitar_cita_exitosa(self):
        inicio = timezone.now() + timedelta(days=1)
        fin = inicio + timedelta(hours=1)
        cita = solicitar_cita(self.paciente, {
            "medico": self.medico.id,
            "hospital": self.hospital.id,
            "tipo": "presencial",
            "inicio": inicio.isoformat(),
            "fin": fin.isoformat(),
        })
        self.assertIsNotNone(cita)
        self.assertEqual(cita.estado, "pendiente")
        self.assertEqual(cita.paciente, self.paciente)
        self.assertEqual(cita.medico, self.medico)

    def test_solicitar_cita_solapamiento(self):
        inicio = timezone.now() + timedelta(days=1)
        fin = inicio + timedelta(hours=2)
        Cita.objects.create(
            medico=self.medico, paciente=self.paciente,
            tipo="presencial", especialidad="Medicina Interna",
            estado="pendiente", inicio=inicio, fin=fin,
        )
        nuevo_inicio = inicio + timedelta(minutes=30)
        nuevo_fin = fin - timedelta(minutes=30)
        with self.assertRaises(ValueError):
            solicitar_cita(self.paciente, {
                "medico": self.medico.id,
                "hospital": self.hospital.id,
                "tipo": "presencial",
                "inicio": nuevo_inicio.isoformat(),
                "fin": nuevo_fin.isoformat(),
            })
