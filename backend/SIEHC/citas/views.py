from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from citas.models import Cita
from citas.serializers import (
    CitaLecturaSerializer,
    CitaEscrituraSerializer,
    MedicoDisponibleSerializer,
    ResumenPagoSerializer,
    FacturacionAtencionSerializer,
)
from services.gestion_administrador.permisos import EsAdministrador
from services.gestion_pacientes.gestion_citas import (
    solicitar_cita,
    cancelar_cita,
    cambiar_estado_cita,
    citas_del_paciente,
    citas_del_medico,
    medicos_disponibles,
)
from services.gestion_medicos.gestion_atencion import (
    registrar_diagnostico,
    emitir_receta,
    registrar_pago
)


# ─────────────────────────────────────────────────────────────────────────────
#  PERMISOS LOCALES
# ─────────────────────────────────────────────────────────────────────────────

class EsPaciente(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.tipo_usuario == "paciente"


class EsMedico(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.tipo_usuario == "medico"


class EsPacienteOMedico(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.tipo_usuario in ("paciente", "medico")


# ─────────────────────────────────────────────────────────────────────────────
#  HU06 — SOLICITAR CITA (paciente)
#  POST /api/citas/solicitar/
# ─────────────────────────────────────────────────────────────────────────────

class SolicitarCitaView(APIView):
    """
    Body JSON:
    {
        "medico": <int>, "hospital": <int> (opcional),
        "tipo": "presencial"|"virtual", "categoria_servicio": "...",
        "especialidad": "...", "prioridad": "normal",
        "inicio": "2026-06-01T09:00:00Z", "fin": "2026-06-01T09:30:00Z",
        "nota": "...", "costo_servicio": 50.00
    }
    """
    permission_classes = [EsPaciente]

    def post(self, request):
        try:
            cita = solicitar_cita(request.user.paciente, request.data)
            return Response(
                {"mensaje": "Cita solicitada exitosamente. Estado: pendiente.", "cita": CitaLecturaSerializer(cita).data},
                status=status.HTTP_201_CREATED,
            )
        except (ValueError, PermissionError) as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────────────────────
#  HU06 — MÉDICOS DISPONIBLES
#  GET /api/citas/medicos-disponibles/?hospital=1&especialidad=Cardiología
# ─────────────────────────────────────────────────────────────────────────────

class MedicosDisponiblesView(APIView):
    permission_classes = [EsPaciente]

    def get(self, request):
        qs = medicos_disponibles(
            hospital_id=request.query_params.get("hospital"),
            especialidad=request.query_params.get("especialidad"),
        )
        return Response(MedicoDisponibleSerializer(qs, many=True).data)


# ─────────────────────────────────────────────────────────────────────────────
#  HU07 — MIS CITAS (paciente)
#  GET /api/citas/mis-citas/?estado=pendiente
# ─────────────────────────────────────────────────────────────────────────────

class MisCitasView(APIView):
    permission_classes = [EsPaciente]

    def get(self, request):
        qs = citas_del_paciente(request.user.paciente, estado=request.query_params.get("estado"))
        return Response(CitaLecturaSerializer(qs, many=True).data)


# ─────────────────────────────────────────────────────────────────────────────
#  HU07 — CANCELAR CITA (paciente)
#  PATCH /api/citas/<pk>/cancelar/
# ─────────────────────────────────────────────────────────────────────────────

class CancelarCitaView(APIView):
    permission_classes = [EsPaciente]

    def patch(self, request, pk):
        try:
            cita = Cita.objects.get(pk=pk)
        except Cita.DoesNotExist:
            return Response({"error": "Cita no encontrada."}, status=status.HTTP_404_NOT_FOUND)
        try:
            cita = cancelar_cita(cita, request.user)
            return Response({"mensaje": "Cita cancelada correctamente.", "cita": CitaLecturaSerializer(cita).data})
        except (ValueError, PermissionError) as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────────────────────
#  HU08 — CITAS DEL MÉDICO
#  GET /api/citas/mis-citas-medico/?estado=confirmada
# ─────────────────────────────────────────────────────────────────────────────

class MisCitasMedicoView(APIView):
    permission_classes = [EsMedico]

    def get(self, request):
        qs = citas_del_medico(request.user.medico, estado=request.query_params.get("estado"))
        return Response(CitaLecturaSerializer(qs, many=True).data)


# ─────────────────────────────────────────────────────────────────────────────
#  MÉDICO — CITAS ACTIVAS
#  GET /api/citas/medico/activas/?paciente_id=<int>
# ─────────────────────────────────────────────────────────────────────────────

class CitasActivasMedicoView(APIView):
    permission_classes = [EsMedico]

    def get(self, request):
        paciente_id = request.query_params.get("paciente_id")
        qs = Cita.objects.filter(
            medico=request.user.medico,
            estado__in=["pendiente", "confirmada", "en_curso"]
        )
        if paciente_id:
            qs = qs.filter(paciente_id=paciente_id)
        return Response(CitaLecturaSerializer(qs, many=True).data)


# ─────────────────────────────────────────────────────────────────────────────
#  HU08 — CAMBIAR ESTADO DE CITA (médico)
#  PATCH /api/citas/<pk>/estado/   body: { "estado": "confirmada" }
# ─────────────────────────────────────────────────────────────────────────────

class CambiarEstadoCitaView(APIView):
    permission_classes = [EsMedico]

    def patch(self, request, pk):
        nuevo_estado = request.data.get("estado")
        if not nuevo_estado:
            return Response({"error": "El campo 'estado' es obligatorio."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            cita = Cita.objects.get(pk=pk)
        except Cita.DoesNotExist:
            return Response({"error": "Cita no encontrada."}, status=status.HTTP_404_NOT_FOUND)
        try:
            cita = cambiar_estado_cita(cita, nuevo_estado, request.user)
            return Response({"mensaje": f"Estado actualizado a '{nuevo_estado}'.", "cita": CitaLecturaSerializer(cita).data})
        except (ValueError, PermissionError) as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────────────────────
#  DETALLE DE CITA (paciente o médico)
#  GET /api/citas/<pk>/detalle/
# ─────────────────────────────────────────────────────────────────────────────

class DetalleCitaView(APIView):
    permission_classes = [EsPacienteOMedico]

    def get(self, request, pk):
        try:
            cita = Cita.objects.select_related(
                "medico__usuario", "medico__hospital", "paciente__usuario"
            ).get(pk=pk)
        except Cita.DoesNotExist:
            return Response({"error": "Cita no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        es_propietario = (
            (hasattr(user, "paciente") and cita.paciente == user.paciente)
            or (hasattr(user, "medico") and cita.medico == user.medico)
        )
        if not es_propietario:
            return Response({"error": "No tienes acceso a esta cita."}, status=status.HTTP_403_FORBIDDEN)
        return Response(CitaLecturaSerializer(cita).data)


# ─────────────────────────────────────────────────────────────────────────────
#  HU08 — HISTORIAL DEL PACIENTE DESDE LA CITA (médico)
#  GET /api/citas/<pk>/paciente/
# ─────────────────────────────────────────────────────────────────────────────

class PacienteDeCitaView(APIView):
    """
    El médico accede al historial completo del paciente directamente
    desde la cita. Devuelve datos de la cita + historial anidado.
    """
    permission_classes = [EsMedico]

    def get(self, request, pk):
        try:
            cita = Cita.objects.select_related(
                "paciente__usuario", "medico"
            ).get(pk=pk, medico=request.user.medico)
        except Cita.DoesNotExist:
            return Response({"error": "Cita no encontrada o no te pertenece."}, status=status.HTTP_404_NOT_FOUND)

        from historial.models import Historial
        from historial.serializers import HistorialDetalleSerializer
        historial, _ = Historial.objects.get_or_create(paciente=cita.paciente)
        return Response({
            "cita":      CitaLecturaSerializer(cita).data,
            "historial": HistorialDetalleSerializer(historial).data,
        })


# ─────────────────────────────────────────────────────────────────────────────
#  HU09 — DIAGNÓSTICO (médico)
#  GET  /api/citas/<pk>/diagnostico/  → lista diagnósticos del paciente
#  POST /api/citas/<pk>/diagnostico/  → registra nuevo diagnóstico
# ─────────────────────────────────────────────────────────────────────────────

class DiagnosticoCitaView(APIView):
    """
    GET  — Lista diagnósticos del historial del paciente de esa cita.
    POST — Registra un nuevo diagnóstico; la cita pasa a 'en_curso' automáticamente.

    Body POST:
    {
        "estado_clinico": "Hipertensión Arterial", "categoria": "Cardiovascular",
        "severidad": "moderado", "ubicacion_anatomica": "Sistema cardiovascular",
        "fecha_hora_inicio": "2026-05-17T10:00:00Z",
        "edad_inicio": 45, "descripcion_inicio": "Presión alta sostenida",
        "nota": "..."  (opcional)
    }
    """
    permission_classes = [EsMedico]

    def get(self, request, pk):
        try:
            cita = Cita.objects.get(pk=pk, medico=request.user.medico)
        except Cita.DoesNotExist:
            return Response({"error": "Cita no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        from historial.models import Historial
        from historial.serializers import DiagnosticoSerializer
        historial, _ = Historial.objects.get_or_create(paciente=cita.paciente)
        qs = historial.diagnosticos.order_by("-fecha_hora_inicio")
        return Response(DiagnosticoSerializer(qs, many=True).data)

    def post(self, request, pk):
        try:
            diagnostico = registrar_diagnostico(request.user.medico, pk, request.data)
            from historial.serializers import DiagnosticoSerializer
            return Response(
                {"mensaje": "Diagnóstico registrado.", "diagnostico": DiagnosticoSerializer(diagnostico).data},
                status=status.HTTP_201_CREATED,
            )
        except PermissionError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────────────────────
#  HU10 — RECETA (médico)
#  GET  /api/citas/<pk>/receta/  → lista recetas del historial del paciente
#  POST /api/citas/<pk>/receta/  → emite nueva receta
# ─────────────────────────────────────────────────────────────────────────────

class RecetaCitaView(APIView):
    """
    GET  — Vista previa de recetas ya emitidas en el historial del paciente.
    POST — Emite una nueva receta vinculada al historial.

    Body POST:
    {
        "medicamento": <int: id>, "intencion": "Controlar presión",
        "categoria": "controlado"|"libre"|"retenida",
        "prioridad": "alta"|"media"|"baja",
        "instruccion_dosis": "1 tableta cada 12 horas",
        "periodo_dosis": "Por 30 días", "cantidad_suministrada": 60
    }
    """
    permission_classes = [EsMedico]

    def get(self, request, pk):
        try:
            cita = Cita.objects.get(pk=pk, medico=request.user.medico)
        except Cita.DoesNotExist:
            return Response({"error": "Cita no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        from historial.models import Historial
        from historial.serializers import RecetaSerializer
        historial, _ = Historial.objects.get_or_create(paciente=cita.paciente)
        qs = historial.recetas.select_related("medicamento").order_by("-fecha_emitida")
        return Response(RecetaSerializer(qs, many=True).data)

    def post(self, request, pk):
        try:
            receta = emitir_receta(request.user.medico, pk, request.data)
            from historial.serializers import RecetaSerializer
            return Response(
                {"mensaje": "Receta emitida correctamente.", "receta": RecetaSerializer(receta).data},
                status=status.HTTP_201_CREATED,
            )
        except PermissionError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────────────────────
#  HU13 — RESUMEN DE PAGO
#  GET /api/citas/<pk>/resumen-pago/
# ─────────────────────────────────────────────────────────────────────────────

class ResumenPagoView(APIView):
    """
    Calcula el total a cobrar: costo_servicio + costo de medicamentos
    de recetas emitidas durante esa cita. Usar antes de POST /pagar/.
    """
    permission_classes = [EsMedico]

    def get(self, request, pk):
        try:
            cita = Cita.objects.select_related(
                "paciente__usuario", "medico"
            ).get(pk=pk, medico=request.user.medico)
        except Cita.DoesNotExist:
            return Response({"error": "Cita no encontrada."}, status=status.HTTP_404_NOT_FOUND)

        from historial.models import Historial
        historial, _ = Historial.objects.get_or_create(paciente=cita.paciente)
        recetas = historial.recetas.select_related("medicamento").filter(fecha_emitida__gte=cita.inicio)

        costo_consulta     = float(cita.costo_servicio)
        costo_medicamentos = sum(float(r.medicamento.costo) * r.cantidad_suministrada for r in recetas)

        return Response(ResumenPagoSerializer({
            "cita_id":            cita.id,
            "paciente":           cita.paciente.usuario.nombre,
            "especialidad":       cita.especialidad,
            "costo_consulta":     costo_consulta,
            "medicamentos": [
                {
                    "medicamento": r.medicamento.nombre,
                    "cantidad":    r.cantidad_suministrada,
                    "costo_unit":  float(r.medicamento.costo),
                    "subtotal":    float(r.medicamento.costo) * r.cantidad_suministrada,
                }
                for r in recetas
            ],
            "costo_medicamentos": costo_medicamentos,
            "monto_total":        costo_consulta + costo_medicamentos,
        }).data)


# ─────────────────────────────────────────────────────────────────────────────
#  HU13 — REGISTRAR PAGO (médico)
#  POST /api/citas/<pk>/pagar/
# ─────────────────────────────────────────────────────────────────────────────

class RegistrarPagoView(APIView):
    """
    Registra el pago en efectivo. Crea Facturacion con estado 'pagado'
    y marca la cita como 'completada'.

    Body: { "descripcion": "Consulta + medicamentos", "monto_total": 150.00 }
    """
    permission_classes = [EsMedico]

    def post(self, request, pk):
        try:
            factura = registrar_pago(request.user.medico, pk, request.data)
            return Response(
                {"mensaje": "Pago registrado. Cita completada.", "factura": FacturacionAtencionSerializer(factura).data},
                status=status.HTTP_201_CREATED,
            )
        except PermissionError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────────────────────
#  VIEWSET ADMIN — CRUD completo
# ─────────────────────────────────────────────────────────────────────────────

class CitaViewSet(ModelViewSet):
    queryset = Cita.objects.select_related(
        "medico__usuario", "medico__hospital", "paciente__usuario"
    ).all()
    serializer_class   = CitaLecturaSerializer
    permission_classes = [EsAdministrador]

    def get_queryset(self):
        qs = super().get_queryset()
        estado   = self.request.query_params.get("estado")
        hospital = self.request.query_params.get("hospital")
        if estado:
            qs = qs.filter(estado=estado)
        if hospital:
            qs = qs.filter(medico__hospital_id=hospital)
        return qs


# ─────────────────────────────────────────────────────────────────────────────
#  HU18 — REPORTE DE UTILIDADES POR SERVICIOS MÉDICOS (admin)
#  GET /api/citas/reporte-servicios/?desde=&hasta=&hospital=
# ─────────────────────────────────────────────────────────────────────────────

class ReporteServiciosView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Sum, Count, F, Value
        from django.db.models.functions import Coalesce

        desde = request.query_params.get('desde')
        hasta = request.query_params.get('hasta')
        hospital_id = request.query_params.get('hospital')

        citas = Cita.objects.filter(estado='completada')

        if desde:
            citas = citas.filter(inicio__gte=desde)
        if hasta:
            citas = citas.filter(inicio__lte=hasta)
        if hospital_id:
            citas = citas.filter(medico__hospital_id=hospital_id)

        # Anotar cada cita con su ingreso real por servicio.
        # Usa el monto facturado (si existe) o el costo_servicio como respaldo.
        from django.db.models import DecimalField
        citas = citas.annotate(
            ingreso_servicio=Coalesce(
                F('factura__monto_total'),
                F('costo_servicio'),
                Value(0, output_field=DecimalField()),
                output_field=DecimalField(max_digits=12, decimal_places=2),
            )
        )

        # Ingresos por hospital
        por_hospital = citas.values(
            'medico__hospital__id',
            'medico__hospital__nombre',
        ).annotate(
            total_ingresos=Sum('ingreso_servicio'),
            total_atenciones=Count('id')
        ).order_by('-total_ingresos')

        # Desglose por tipo de servicio
        por_servicio = citas.values(
            'categoria_servicio',
        ).annotate(
            total_ingresos=Sum('ingreso_servicio'),
            total_atenciones=Count('id')
        ).order_by('-total_ingresos')

        # Desglose por médico responsable
        por_medico = citas.values(
            'medico__usuario__nombre',
            'medico__especialidad',
            'medico__hospital__nombre',
        ).annotate(
            total_ingresos=Sum('ingreso_servicio'),
            total_atenciones=Count('id')
        ).order_by('-total_ingresos')

        # Totales globales
        totales = citas.aggregate(
            total_ingresos=Sum('ingreso_servicio'),
            total_atenciones=Count('id'),
        )

        return Response({
            'por_hospital': por_hospital,
            'por_servicio': por_servicio,
            'por_medico': por_medico,
            'totales': totales,
        })