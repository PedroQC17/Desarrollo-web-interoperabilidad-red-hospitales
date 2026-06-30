from io import BytesIO
from django.db import models
from django.http import HttpResponse
from fpdf import FPDF

from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from historial.models import Historial, Observacion, Examen, Receta, Diagnostico
from citas.models import Cita
from historial.serializers import (
    HistorialSerializer,
    HistorialDetalleSerializer,
    ObservacionSerializer,
    ExamenSerializer,
    RecetaSerializer,
    DiagnosticoSerializer,
)
from services.gestion_administrador.permisos import EsAdministrador
from services.gestion_pacientes.gestion_historial import (
    obtener_o_crear_historial,
    subir_historial,
    obtener_diagnosticos,
    obtener_recetas,
)
from services.gestion_historial.procesar_pdf import procesar_pdf_historial


# ─────────────────────────────────────────────────────────────────────────────
#  PERMISOS LOCALES
# ─────────────────────────────────────────────────────────────────────────────

class EsPaciente(IsAuthenticated):
    """Permite acceso solo si el usuario es paciente."""
    def has_permission(self, request, view):
        return (
            super().has_permission(request, view)
            and request.user.tipo_usuario == 'paciente'
        )


class EsMedico(IsAuthenticated):
    """Permite acceso solo si el usuario es médico."""
    def has_permission(self, request, view):
        return (
            super().has_permission(request, view)
            and request.user.tipo_usuario == 'medico'
        )


class EsPacienteOMedico(IsAuthenticated):
    """Permite acceso a pacientes o médicos."""
    def has_permission(self, request, view):
        return (
            super().has_permission(request, view)
            and request.user.tipo_usuario in ('paciente', 'medico')
        )


# ─────────────────────────────────────────────────────────────────────────────
#  HU03 + HU04 — HISTORIAL DEL PACIENTE
#  GET  /api/historiales/mi-historial/          → ver historial completo
#  POST /api/historiales/subir/                 → crear/completar historial
# ─────────────────────────────────────────────────────────────────────────────

class MiHistorialView(APIView):
    """
    HU04 — El paciente consulta su propio historial (solo lectura).
    Devuelve diagnósticos, recetas, observaciones y exámenes anidados.
    """
    permission_classes = [EsPaciente]

    def get(self, request):
        paciente = request.user.paciente
        historial, _ = obtener_o_crear_historial(paciente)
        serializer = HistorialDetalleSerializer(historial)
        return Response(serializer.data)


class SubirHistorialView(APIView):
    """
    HU03 — El paciente sube (crea o completa) su historial clínico.
    O el médico sube observaciones de atención médica.

    Body JSON esperado:
    {
        "diagnosticos":  [ { "estado_clinico": "...", "categoria": "...", ... } ],
        "recetas":       [ { "medicamento": <id>, "instruccion_dosis": "...", ... } ],
        "observaciones": [ { "motivo_consulta": "...", ... } ],
        "examenes":      [ { "tipo": "laboratorio", "descripcion": "...", ... } ]
    }
    Todos los campos son opcionales; solo se guardan los que lleguen.
    """
    permission_classes = [EsPacienteOMedico]

    def post(self, request):
        if request.user.tipo_usuario == 'medico':
            paciente_id = request.data.get('paciente') or request.data.get('paciente_id')
            if not paciente_id:
                return Response(
                    {"error": "El campo 'paciente' o 'paciente_id' es obligatorio para médicos."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            from usuarios.models import Paciente
            try:
                paciente = Paciente.objects.get(pk=paciente_id)
            except Paciente.DoesNotExist:
                return Response(
                    {"error": "Paciente no encontrado."},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            paciente = request.user.paciente

        try:
            resumen = subir_historial(paciente, request.data)
            return Response(
                {
                    "mensaje": "Historial actualizado correctamente.",
                    "resumen": resumen,
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class SubirHistorialPdfView(APIView):
    """
    POST /api/historiales/subir-pdf/
    El paciente sube su historial en PDF; el backend lo procesa y guarda.
    """
    permission_classes = [EsPaciente]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        archivo = request.FILES.get("archivo")
        if not archivo:
            return Response({"error": "Debes subir un archivo PDF."}, status=status.HTTP_400_BAD_REQUEST)
        if not archivo.name.lower().endswith(".pdf"):
            return Response({"error": "El archivo debe ser un PDF."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            paciente = request.user.paciente
            resumen = procesar_pdf_historial(paciente, archivo)
            return Response({"mensaje": "Historial procesado correctamente.", "resumen": resumen}, status=status.HTTP_201_CREATED)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────────────────────
#  HU04 — DIAGNÓSTICOS Y RECETAS (lectura por paciente)
#  GET /api/historiales/mis-diagnosticos/
#  GET /api/historiales/mis-recetas/
# ─────────────────────────────────────────────────────────────────────────────

class MisDiagnosticosView(APIView):
    """
    HU04 — Lista los diagnósticos del paciente autenticado,
    ordenados por fecha descendente, con datos del médico y hospital.
    """
    permission_classes = [EsPaciente]

    def get(self, request):
        paciente = request.user.paciente
        qs = obtener_diagnosticos(paciente)
        serializer = DiagnosticoSerializer(qs, many=True)
        return Response(serializer.data)


class MisRecetasView(APIView):
    """
    HU04 — Lista las recetas del paciente autenticado,
    ordenadas por fecha descendente, con nombre del medicamento.
    """
    permission_classes = [EsPaciente]

    def get(self, request):
        paciente = request.user.paciente
        qs = obtener_recetas(paciente)
        serializer = RecetaSerializer(qs, many=True)
        return Response(serializer.data)


# ─────────────────────────────────────────────────────────────────────────────
#  HU05 — CONSENTIMIENTO INFORMADO
#  PATCH /api/historiales/consentimiento/
# ─────────────────────────────────────────────────────────────────────────────

class ConsentimientoView(APIView):
    """
    HU05 — El paciente acepta o revoca su consentimiento.
    El campo `activo` del Historial se usa como flag de consentimiento:
      true  → consentimiento otorgado
      false → consentimiento revocado
    Body: { "aceptado": true | false }
    """
    permission_classes = [EsPaciente]

    def patch(self, request):
        paciente = request.user.paciente
        aceptado = request.data.get("aceptado")

        if aceptado is None:
            return Response(
                {"error": "El campo 'aceptado' es obligatorio (true/false)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        historial, _ = obtener_o_crear_historial(paciente)
        historial.activo = bool(aceptado)
        historial.save(update_fields=["activo"])

        return Response(
            {
                "mensaje": (
                    "Consentimiento otorgado." if aceptado
                    else "Consentimiento revocado."
                ),
                "historial_id": historial.id,
                "consentimiento_activo": historial.activo,
            }
        )


# ─────────────────────────────────────────────────────────────────────────────
#  MÉDICO — acceso al historial de un paciente desde una cita
#  GET /api/historiales/paciente/<paciente_id>/
# ─────────────────────────────────────────────────────────────────────────────

class HistorialPacienteView(APIView):
    """
    Permite al médico consultar el historial completo de un paciente.
    Solo accesible si el médico tiene al menos una cita activa/confirmada
    con ese paciente (seguridad básica).
    """
    permission_classes = [EsMedico]

    def get(self, request, paciente_id):
        from usuarios.models import Paciente
        from citas.models import Cita

        medico = request.user.medico

        # Verificar que el médico tenga una cita con este paciente
        tiene_cita = Cita.objects.filter(
            medico=medico,
            paciente_id=paciente_id,
        ).exists()

        if not tiene_cita:
            return Response(
                {"error": "No tienes acceso al historial de este paciente."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            paciente = Paciente.objects.get(pk=paciente_id)
            historial, _ = obtener_o_crear_historial(paciente)
        except Paciente.DoesNotExist:
            return Response(
                {"error": "Paciente no encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = HistorialDetalleSerializer(historial)
        return Response(serializer.data)


# ─────────────────────────────────────────────────────────────────────────────
#  VIEWSETS BASE (para el admin y operaciones CRUD directas)
# ─────────────────────────────────────────────────────────────────────────────

class HistorialViewSet(ModelViewSet):
    """CRUD completo de historial — solo admins."""
    queryset           = Historial.objects.all()
    serializer_class   = HistorialSerializer
    permission_classes = [EsAdministrador]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'paciente'):
            return Historial.objects.filter(paciente=user.paciente)
        return super().get_queryset()


class ObservacionViewSet(ModelViewSet):
    queryset           = Observacion.objects.all()
    serializer_class   = ObservacionSerializer
    permission_classes = [IsAuthenticated]


class ExamenViewSet(ModelViewSet):
    queryset           = Examen.objects.all()
    serializer_class   = ExamenSerializer
    permission_classes = [IsAuthenticated]


class RecetaViewSet(ModelViewSet):
    queryset           = Receta.objects.all()
    serializer_class   = RecetaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset().select_related("medicamento", "historial__paciente").prefetch_related(
            models.Prefetch("historial__paciente__citas", queryset=Cita.objects.order_by("-inicio"))
        )
        user = self.request.user
        if user.tipo_usuario == "medico":
            qs = qs.filter(historial__paciente__citas__medico__usuario=user).distinct()
        return qs

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        receta = self.get_object()
        hist = receta.historial
        paciente = hist.paciente
        cita = paciente.citas.order_by('-inicio').first()
        hospital = cita.medico.hospital.nombre if cita and cita.medico and cita.medico.hospital else "—"
        medico = cita.medico.usuario.nombre if cita and cita.medico else "—"

        pdf = FPDF()
        pdf.add_page()
        pdf.set_font('Helvetica', 'B', 18)
        pdf.cell(0, 12, 'SIEHC - Receta Medica', new_x='LMARGIN', new_y='NEXT', align='C')
        pdf.ln(6)

        pdf.set_font('Helvetica', '', 10)
        items = [
            ('Receta N.', f'#REC-{receta.id}'),
            ('Hospital', hospital),
            ('Medico', medico),
            ('Paciente', paciente.usuario.nombre),
            ('Fecha', receta.fecha_emitida.strftime('%d/%m/%Y %H:%M')),
            ('Medicamento', receta.medicamento.nombre),
            ('Cantidad', str(receta.cantidad_suministrada)),
            ('Dosis', receta.instruccion_dosis),
            ('Periodo', receta.periodo_dosis),
            ('Intencion', receta.intencion),
            ('Categoria', receta.get_categoria_display()),
            ('Prioridad', receta.get_prioridad_display()),
        ]
        for label, value in items:
            pdf.set_font('Helvetica', 'B', 10)
            pdf.cell(30, 7, label + ':', border=1)
            pdf.set_font('Helvetica', '', 10)
            pdf.cell(0, 7, str(value), border=1, new_x='LMARGIN', new_y='NEXT')

        pdf.ln(16)
        pdf.set_font('Helvetica', '', 10)
        pdf.cell(0, 7, '___________________________', new_x='LMARGIN', new_y='NEXT', align='R')
        pdf.cell(0, 7, f'Firma: {medico}', new_x='LMARGIN', new_y='NEXT', align='R')

        buf = BytesIO()
        pdf.output(buf)
        buf.seek(0)
        return HttpResponse(buf, content_type='application/pdf',
                            headers={'Content-Disposition': f'attachment; filename="receta_{receta.id}.pdf"'})


class DiagnosticoViewSet(ModelViewSet):
    queryset           = Diagnostico.objects.all()
    serializer_class   = DiagnosticoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset().select_related("historial__paciente").prefetch_related(
            models.Prefetch("historial__paciente__citas", queryset=Cita.objects.order_by("-inicio"))
        )
        user = self.request.user
        if user.tipo_usuario == "medico":
            qs = qs.filter(historial__paciente__citas__medico__usuario=user).distinct()
        return qs


#Funciones para la atencion medica

from medicamentos.models import Medicamento

from services.gestion_medicos.gestion_atencion import (
    registrar_diagnostico,
    emitir_receta,
    despachar_medicamentos,
)

class RegistrarDiagnosticoView(APIView):
    """
    ⚠️ DEPRECATED: Use DiagnosticoCitaView from citas app instead.
    
    Esta vista solo acepta solicitudes para mantener compatibilidad backward,
    pero redirige al flujo correcto a través de citas.
    
    Endpoint correcto: POST /api/citas/<cita_id>/diagnostico/
    """
    permission_classes = [EsMedico]

    def post(self, request, historial_id):
        return Response(
            {
                "error": "Este endpoint es obsoleto.",
                "mensaje": "Usa POST /api/citas/<cita_id>/diagnostico/ en su lugar.",
                "nota": "El diagnóstico debe estar asociado a una cita específica."
            },
            status=status.HTTP_410_GONE
        )
    

class CrearRecetaView(APIView):
    """
    ⚠️ DEPRECATED: Use RecetaCitaView from citas app instead.
    
    Endpoint correcto: POST /api/citas/<cita_id>/receta/
    """
    permission_classes = [EsMedico]

    def post(self, request):
        return Response(
            {
                "error": "Este endpoint es obsoleto.",
                "mensaje": "Usa POST /api/citas/<cita_id>/receta/ en su lugar.",
                "nota": "Las recetas deben ser emitidas desde la cita del paciente."
            },
            status=status.HTTP_410_GONE
        )

class DespacharMedicamentoView(APIView):
    """
    ⚠️ DEPRECATED: Use DespacharMedicamentosView from medicamentos app instead.
    
    Endpoint correcto: POST /api/medicamentos/despachar/<cita_id>/
    """
    permission_classes = [EsMedico]

    def post(self, request, receta_id):
        return Response(
            {
                "error": "Este endpoint es obsoleto.",
                "mensaje": "Usa POST /api/medicamentos/despachar/<cita_id>/ en su lugar.",
                "nota": "El despacho de medicamentos se hace a nivel de cita, no de receta individual."
            },
            status=status.HTTP_410_GONE
        )
    
