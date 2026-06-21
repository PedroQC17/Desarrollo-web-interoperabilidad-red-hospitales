from django.test import TestCase
from datetime import date, timedelta
from django.utils import timezone

from usuarios.models import Usuario, Paciente
from hospitales.models import Hospital
from medicamentos.models import Medicamento
from historial.models import Historial, Diagnostico, Receta
from services.gestion_pacientes.gestion_historial import obtener_o_crear_historial, subir_historial


class HistorialModelTest(TestCase):
    def setUp(self):
        self.paciente_user = Usuario.objects.create_user(
            email="carmen.torres@hospital.com", password="PacientePass555!",
            nombre="Carmen Torres Gutiérrez", telecom="987654019",
            genero="F", fec_nac=date(1978, 3, 15), tipo_usuario="paciente",
        )
        self.paciente = Paciente.objects.create(usuario=self.paciente_user)
        self.historial = Historial.objects.create(paciente=self.paciente)

    def test_historial_activo_default_true(self):
        self.assertTrue(self.historial.activo)

    def test_crear_diagnostico_en_historial(self):
        diagnostico = Diagnostico.objects.create(
            historial=self.historial,
            estado_clinico="Diabetes mellitus tipo 2",
            categoria="Endocrinología",
            severidad="moderado",
            ubicacion_anatomica="Páncreas - islotes de Langerhans",
            fecha_hora_inicio=timezone.now(),
            edad_inicio=45,
            descripcion_inicio="Glucemia en ayunas 180 mg/dL, HbA1c 8.2%",
        )
        self.assertEqual(self.historial.diagnosticos.count(), 1)
        self.assertEqual(diagnostico.estado_clinico, "Diabetes mellitus tipo 2")

    def test_crear_receta_en_historial(self):
        hospital = Hospital.objects.create(
            tipo="publico", nombre="Hospital Nacional Edgardo Rebagliati Martins",
            alias="HNERM", contacto="01-2658000",
            especialidad="Medicina General",
            ubicacion="Av. Edgardo Rebagliati 490 - Jesús María",
            periodo="Lun-Dom 24h", activo=True,
        )
        medicamento = Medicamento.objects.create(
            hospital=hospital, nombre="Metformina 850mg",
            funcion="Hipoglucemiante oral para el control de diabetes tipo 2",
            tipo="otro", stock=200, costo=3.50,
        )
        receta = Receta.objects.create(
            historial=self.historial,
            medicamento=medicamento,
            intencion="Control glucémico en diabetes tipo 2",
            categoria="libre",
            prioridad="media",
            instruccion_dosis="1 tableta cada 12 horas con alimentos",
            periodo_dosis="Por 90 días consecutivos",
            cantidad_suministrada=180,
        )
        self.assertEqual(self.historial.recetas.count(), 1)
        self.assertEqual(receta.medicamento.nombre, "Metformina 850mg")


class HistorialServiceTest(TestCase):
    def setUp(self):
        self.paciente_user = Usuario.objects.create_user(
            email="ricardo.quispe@hospital.com", password="PacientePass666!",
            nombre="Ricardo Quispe Mamani", telecom="987654020",
            genero="M", fec_nac=date(1965, 11, 3), tipo_usuario="paciente",
        )
        self.paciente = Paciente.objects.create(usuario=self.paciente_user)

    def test_historial_se_crea_auto_al_obtener(self):
        self.assertFalse(Historial.objects.filter(paciente=self.paciente).exists())
        historial, created = obtener_o_crear_historial(self.paciente)
        self.assertTrue(created)
        self.assertIsNotNone(historial)
        self.assertEqual(historial.paciente, self.paciente)

    def test_subir_historial_crea_diagnosticos(self):
        resumen = subir_historial(self.paciente, {
            "diagnosticos": [{
                "estado_clinico": "Hipertensión arterial esencial",
                "categoria": "Cardiovascular",
                "severidad": "moderado",
                "ubicacion_anatomica": "Sistema cardiovascular - arterias sistémicas",
                "fecha_hora_inicio": timezone.now(),
                "edad_inicio": 55,
                "descripcion_inicio": "PA 155/95 mmHg en tres mediciones consecutivas",
            }],
        })
        self.assertEqual(resumen["diagnosticos_creados"], 1)
        self.assertTrue(Historial.objects.filter(paciente=self.paciente).exists())
        historial = Historial.objects.get(paciente=self.paciente)
        self.assertEqual(historial.diagnosticos.count(), 1)
