from django.test import TestCase
from datetime import date, timedelta
from django.utils import timezone

from usuarios.models import Usuario, Paciente, Medico
from hospitales.models import Hospital
from citas.models import Cita
from medicamentos.models import Medicamento, Despacho, DespachoItem
from services.gestion_medicos.gestion_atencion import despachar_medicamentos


class MedicamentoModelTest(TestCase):
    def setUp(self):
        self.hospital = Hospital.objects.create(
            tipo="publico", nombre="Hospital Nacional Arzobispo Loayza",
            alias="HNAL", contacto="01-3304000",
            especialidad="Medicina General",
            ubicacion="Av. Alfonso Ugarte 848 - Lima",
            periodo="Lun-Vie 8am-8pm", activo=True,
        )
        self.medicamento = Medicamento.objects.create(
            hospital=self.hospital,
            nombre="Paracetamol 500mg",
            funcion="Analgésico y antipirético para el alivio del dolor leve a moderado",
            tipo="analgesico",
            stock=100,
            costo=2.50,
        )

    def test_medicamento_hay_stock_suficiente(self):
        self.assertTrue(self.medicamento.hay_stock(50))
        self.assertTrue(self.medicamento.hay_stock(100))
        self.assertFalse(self.medicamento.hay_stock(150))

    def test_despacho_item_subtotal_automatico(self):
        medico_user = Usuario.objects.create_user(
            email="antonio.reyes@hospital.com", password="MedicoPass333!",
            nombre="Dr. Antonio Reyes Márquez", telecom="987654015",
            genero="M", fec_nac=date(1979, 7, 22), tipo_usuario="medico",
        )
        medico = Medico.objects.create(
            usuario=medico_user, hospital=self.hospital,
            periodo="Lun-Vie 9am-5pm", especialidad="Medicina General",
            ubicacion="Consultorio 101 - Pabellón A",
            servicio_sanitario="Servicio de Medicina General",
        )
        paciente_user = Usuario.objects.create_user(
            email="maria.rojas@hospital.com", password="PacientePass333!",
            nombre="María Rojas Paredes", telecom="987654016",
            genero="F", fec_nac=date(1993, 12, 8), tipo_usuario="paciente",
        )
        paciente = Paciente.objects.create(usuario=paciente_user)
        inicio = timezone.now() + timedelta(days=1)
        cita = Cita.objects.create(
            medico=medico, paciente=paciente,
            tipo="presencial", especialidad="Medicina General",
            inicio=inicio, fin=inicio + timedelta(hours=1),
        )
        despacho = Despacho.objects.create(medico=medico, cita=cita)
        item = DespachoItem.objects.create(
            despacho=despacho,
            medicamento=self.medicamento,
            cantidad=2,
            precio_unitario=2.50,
        )
        self.assertEqual(item.subtotal, 5.00)


class MedicamentoServiceTest(TestCase):
    def setUp(self):
        self.hospital = Hospital.objects.create(
            tipo="publico", nombre="Hospital Nacional Hipólito Unanue",
            alias="HNHU", contacto="01-3620000",
            especialidad="Medicina Interna",
            ubicacion="Av. César Vallejo 1390 - El Agustino",
            periodo="Lun-Dom 24h", activo=True,
        )
        self.medicamento = Medicamento.objects.create(
            hospital=self.hospital,
            nombre="Amoxicilina 500mg",
            funcion="Antibiótico de amplio espectro para infecciones bacterianas",
            tipo="antibiotico",
            stock=50,
            costo=8.00,
        )
        self.medico_user = Usuario.objects.create_user(
            email="patricia.guzman@hospital.com", password="MedicaPass444!",
            nombre="Dra. Patricia Guzmán Flores", telecom="987654017",
            genero="F", fec_nac=date(1981, 4, 30), tipo_usuario="medico",
        )
        self.medico = Medico.objects.create(
            usuario=self.medico_user, hospital=self.hospital,
            periodo="Lun-Vie 8am-4pm", especialidad="Medicina Interna",
            ubicacion="Consultorio 305 - Pabellón Principal",
            servicio_sanitario="Servicio de Medicina Interna",
            disponibilidad=True,
        )
        self.paciente_user = Usuario.objects.create_user(
            email="jose.salazar@hospital.com", password="PacientePass444!",
            nombre="José Salazar Huamán", telecom="987654018",
            genero="M", fec_nac=date(1988, 6, 25), tipo_usuario="paciente",
        )
        self.paciente = Paciente.objects.create(usuario=self.paciente_user)
        inicio = timezone.now() + timedelta(days=1)
        self.cita = Cita.objects.create(
            medico=self.medico, paciente=self.paciente,
            tipo="presencial", especialidad="Medicina Interna",
            estado="en_curso",
            inicio=inicio, fin=inicio + timedelta(hours=1),
        )

    def test_despachar_con_stock_suficiente(self):
        resultado = despachar_medicamentos(self.medico, self.cita.id, [
            {"medicamento": self.medicamento.id, "cantidad": 10},
        ])
        self.medicamento.refresh_from_db()
        self.assertEqual(self.medicamento.stock, 40)
        self.assertEqual(len(resultado["items"]), 1)
        self.assertEqual(resultado["items"][0]["cantidad_despachada"], 10)
        self.assertEqual(resultado["items"][0]["stock_restante"], 40)
        self.assertEqual(float(resultado["items"][0]["subtotal"]), 80.00)

    def test_despachar_sin_stock_error(self):
        self.medicamento.stock = 3
        self.medicamento.save()
        with self.assertRaises(ValueError):
            despachar_medicamentos(self.medico, self.cita.id, [
                {"medicamento": self.medicamento.id, "cantidad": 10},
            ])
