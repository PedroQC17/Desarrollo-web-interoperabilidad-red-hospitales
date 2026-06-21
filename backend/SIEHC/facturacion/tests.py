from django.test import TestCase
from datetime import date, timedelta
from django.utils import timezone

from usuarios.models import Usuario, Paciente, Medico
from hospitales.models import Hospital
from citas.models import Cita
from facturacion.models import Facturacion
from services.gestion_medicos.gestion_atencion import registrar_pago


class FacturacionModelTest(TestCase):
    def setUp(self):
        self.hospital = Hospital.objects.create(
            tipo="publico", nombre="Hospital Nacional Sergio E. Bernales",
            alias="HNSEB", contacto="01-5140500",
            especialidad="Medicina General",
            ubicacion="Av. Alcides Carrión s/n - Collique, Comas",
            periodo="Lun-Dom 24h", activo=True,
        )
        self.medico_user = Usuario.objects.create_user(
            email="sofia.ramirez@hospital.com", password="MedicaPass777!",
            nombre="Dra. Sofía Ramírez Paredes", telecom="987654021",
            genero="F", fec_nac=date(1983, 9, 12), tipo_usuario="medico",
        )
        self.medico = Medico.objects.create(
            usuario=self.medico_user, hospital=self.hospital,
            periodo="Lun-Vie 7am-3pm", especialidad="Medicina General",
            ubicacion="Consultorio 112 - Pabellón A",
            servicio_sanitario="Servicio de Medicina General",
        )
        self.paciente_user = Usuario.objects.create_user(
            email="elena.vargas@hospital.com", password="PacientePass777!",
            nombre="Elena Vargas Quispe", telecom="987654022",
            genero="F", fec_nac=date(1995, 7, 28), tipo_usuario="paciente",
        )
        self.paciente = Paciente.objects.create(usuario=self.paciente_user)
        inicio = timezone.now() + timedelta(days=1)
        self.cita = Cita.objects.create(
            medico=self.medico, paciente=self.paciente,
            tipo="presencial", especialidad="Medicina General",
            inicio=inicio, fin=inicio + timedelta(hours=1),
        )

    def test_crear_factura_con_estado_pendiente(self):
        factura = Facturacion.objects.create(
            cita=self.cita,
            descripcion="Consulta médica general",
            monto_total=120.00,
        )
        self.assertEqual(factura.estado_pago, "pendiente")
        self.assertEqual(factura.monto_total, 120.00)


class FacturacionServiceTest(TestCase):
    def setUp(self):
        self.hospital = Hospital.objects.create(
            tipo="publico", nombre="Hospital Nacional San Bartolomé",
            alias="HNSB", contacto="01-3302000",
            especialidad="Ginecología y Pediatría",
            ubicacion="Av. San Bartolomé 899 - Cercado de Lima",
            periodo="Lun-Dom 24h", activo=True,
        )
        self.medico_user = Usuario.objects.create_user(
            email="carlos.mendoza@hospital.com", password="MedicoPass888!",
            nombre="Dr. Carlos Mendoza Linares", telecom="987654023",
            genero="M", fec_nac=date(1975, 3, 8), tipo_usuario="medico",
        )
        self.medico = Medico.objects.create(
            usuario=self.medico_user, hospital=self.hospital,
            periodo="Lun-Vie 8am-4pm", especialidad="Pediatría",
            ubicacion="Consultorio 205 - Pabellón Infantil",
            servicio_sanitario="Servicio de Pediatría",
        )
        self.paciente_user = Usuario.objects.create_user(
            email="lucia.fernandez@hospital.com", password="PacientePass888!",
            nombre="Lucía Fernández Rojas", telecom="987654024",
            genero="F", fec_nac=date(2002, 10, 15), tipo_usuario="paciente",
        )
        self.paciente = Paciente.objects.create(usuario=self.paciente_user)
        inicio = timezone.now() + timedelta(days=1)
        self.cita = Cita.objects.create(
            medico=self.medico, paciente=self.paciente,
            tipo="presencial", especialidad="Pediatría",
            estado="en_curso", inicio=inicio, fin=inicio + timedelta(hours=1),
            costo_servicio=150.00,
        )

    def test_registrar_pago_completa_cita(self):
        factura = registrar_pago(self.medico, self.cita.id, {
            "monto_total": 200.00,
            "descripcion": "Consulta pediátrica + vacunación",
        })
        self.assertIsNotNone(factura)
        self.assertEqual(factura.estado_pago, "pagado")
        self.assertEqual(factura.monto_total, 200.00)
        self.assertEqual(factura.cita, self.cita)
        self.cita.refresh_from_db()
        self.assertEqual(self.cita.estado, "completada")

    def test_registrar_pago_doble_error(self):
        registrar_pago(self.medico, self.cita.id, {"monto_total": 150.00})
        with self.assertRaises(ValueError):
            registrar_pago(self.medico, self.cita.id, {"monto_total": 150.00})
