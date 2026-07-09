from django.http import JsonResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Paciente, Historial, Observacion, Diagnostico, Receta
from .serializers import (
    PacienteSerializer, HistorialSerializer, HistorialDetalleSerializer,
    DiagnosticoSerializer, RecetaSerializer, ObservacionSerializer,
)


def health(request):
    return JsonResponse({"status": "ok", "service": "pacientes-service"})


def _is_admin(request):
    return getattr(request.user, "tipo_usuario", "") == "admin"

# creacion de vistas de paciente
def _is_medico(request):
    return getattr(request.user, "tipo_usuario", "") == "medico"


def _is_paciente(request):
    return getattr(request.user, "tipo_usuario", "") == "paciente"


def _get_paciente_from_user(request):
    try:
        return Paciente.objects.get(user_id=request.user.id)
    except Paciente.DoesNotExist:
        return Paciente.objects.create(user_id=request.user.id)


def _obtener_o_crear_historial(paciente):
    hist, created = Historial.objects.get_or_create(paciente=paciente)
    return hist


# ── Paciente CRUD ──────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def paciente_list(request):
    if request.method == "GET":
        if _is_admin(request):
            queryset = Paciente.objects.all()
        else:
            queryset = Paciente.objects.filter(user_id=request.user.id)
        serializer = PacienteSerializer(queryset, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        if not _is_admin(request):
            return Response({"error": "Solo administradores"}, status=status.HTTP_403_FORBIDDEN)
        serializer = PacienteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def paciente_detail(request, pk):
    try:
        paciente = Paciente.objects.get(pk=pk)
    except Paciente.DoesNotExist:
        return Response({"error": "Paciente no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        if not _is_admin(request) and paciente.user_id != request.user.id:
            return Response({"error": "No tienes permiso"}, status=status.HTTP_403_FORBIDDEN)
        serializer = PacienteSerializer(paciente)
        return Response(serializer.data)

    if request.method in ("PUT", "PATCH"):
        if not _is_admin(request):
            return Response({"error": "Solo administradores"}, status=status.HTTP_403_FORBIDDEN)
        partial = request.method == "PATCH"
        serializer = PacienteSerializer(paciente, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    if request.method == "DELETE":
        if not _is_admin(request):
            return Response({"error": "Solo administradores"}, status=status.HTTP_403_FORBIDDEN)
        paciente.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Historial endpoints ────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mi_historial(request):
    if not _is_paciente(request):
        return Response({"error": "Solo pacientes"}, status=status.HTTP_403_FORBIDDEN)
    paciente = _get_paciente_from_user(request)
    historial = _obtener_o_crear_historial(paciente)
    serializer = HistorialDetalleSerializer(historial)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mis_diagnosticos(request):
    if not _is_paciente(request):
        return Response({"error": "Solo pacientes"}, status=status.HTTP_403_FORBIDDEN)
    paciente = _get_paciente_from_user(request)
    historial = _obtener_o_crear_historial(paciente)
    qs = historial.diagnosticos.all()
    serializer = DiagnosticoSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mis_recetas(request):
    if not _is_paciente(request):
        return Response({"error": "Solo pacientes"}, status=status.HTTP_403_FORBIDDEN)
    paciente = _get_paciente_from_user(request)
    historial = _obtener_o_crear_historial(paciente)
    qs = historial.recetas.all()
    serializer = RecetaSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def diagnosticos_list(request):
    if _is_admin(request):
        qs = Diagnostico.objects.all()
    elif _is_medico(request):
        qs = Diagnostico.objects.all()
    else:
        return Response({"error": "No tienes permiso"}, status=status.HTTP_403_FORBIDDEN)
    serializer = DiagnosticoSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def recetas_list(request):
    if _is_admin(request):
        qs = Receta.objects.all()
    elif _is_medico(request):
        qs = Receta.objects.all()
    else:
        return Response({"error": "No tienes permiso"}, status=status.HTTP_403_FORBIDDEN)
    serializer = RecetaSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def subir_historial(request):
    if not _is_paciente(request) and not _is_medico(request):
        return Response({"error": "No tienes permiso"}, status=status.HTTP_403_FORBIDDEN)

    if _is_medico(request):
        paciente_id = request.data.get('paciente') or request.data.get('paciente_id')
        if not paciente_id:
            return Response({"error": "El campo 'paciente' o 'paciente_id' es obligatorio para médicos."},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            paciente = Paciente.objects.get(pk=paciente_id)
        except Paciente.DoesNotExist:
            return Response({"error": "Paciente no encontrado."}, status=status.HTTP_404_NOT_FOUND)
    else:
        paciente = _get_paciente_from_user(request)

    historial = _obtener_o_crear_historial(paciente)

    observaciones_data = request.data.get('observaciones', [])
    for obs in observaciones_data:
        Observacion.objects.create(
            historial=historial,
            motivo_consulta=obs.get('motivo_consulta', ''),
            antecedentes_patologicos=obs.get('antecedentes_patologicos', ''),
        )

    diagnosticos_data = request.data.get('diagnosticos', [])
    for diag in diagnosticos_data:
        Diagnostico.objects.create(historial=historial, **diag)

    recetas_data = request.data.get('recetas', [])
    for rec in recetas_data:
        Receta.objects.create(historial=historial, **rec)

    return Response({
        "mensaje": "Historial actualizado correctamente.",
        "resumen": {
            "observaciones": len(observaciones_data),
            "diagnosticos": len(diagnosticos_data),
            "recetas": len(recetas_data),
        }
    }, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def subir_historial_pdf(request):
    if not _is_paciente(request):
        return Response({"error": "Solo pacientes"}, status=status.HTTP_403_FORBIDDEN)
    archivo = request.FILES.get("archivo")
    if not archivo:
        return Response({"error": "Debes subir un archivo PDF."}, status=status.HTTP_400_BAD_REQUEST)
    if not archivo.name.lower().endswith(".pdf"):
        return Response({"error": "El archivo debe ser un PDF."}, status=status.HTTP_400_BAD_REQUEST)

    paciente = _get_paciente_from_user(request)
    historial = _obtener_o_crear_historial(paciente)

    def resolver_medicamento(nombre):
        try:
            import os, httpx
            med_url = os.getenv("SERVICE_MEDICAMENTOS", "http://localhost:8005")
            resp = httpx.get(
                f"{med_url}/api/medicamentos/buscar/",
                params={"nombre": nombre, "activos": "true"},
                timeout=5,
            )
            if resp.status_code == 200:
                data = resp.json()
                return data.get("id")
        except Exception:
            pass
        return None

    try:
        from .procesar_pdf import procesar_pdf_historial
        resumen = procesar_pdf_historial(paciente, archivo, medicamento_resolver=resolver_medicamento)
        return Response({
            "mensaje": "Historial procesado correctamente.",
            "resumen": resumen,
        }, status=status.HTTP_201_CREATED)
    except ImportError:
        return Response({
            "mensaje": "PDF subido pero no se pudo procesar (falta pdfplumber).",
            "resumen": {}
        }, status=status.HTTP_201_CREATED)
    except Exception as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def consentimiento(request):
    if not _is_paciente(request):
        return Response({"error": "Solo pacientes"}, status=status.HTTP_403_FORBIDDEN)
    paciente = _get_paciente_from_user(request)
    historial = _obtener_o_crear_historial(paciente)

    aceptado = request.data.get("aceptado")
    if aceptado is None and "compartir_red" not in request.data and "investigacion" not in request.data:
        return Response(
            {"error": "Debes enviar al menos un campo: 'aceptado', 'compartir_red' o 'investigacion'."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    update = []
    if aceptado is not None:
        historial.activo = bool(aceptado)
        update.append("activo")
    if "compartir_red" in request.data:
        historial.compartir_red = bool(request.data["compartir_red"])
        update.append("compartir_red")
    if "investigacion" in request.data:
        historial.investigacion = bool(request.data["investigacion"])
        update.append("investigacion")
    historial.save(update_fields=update)

    return Response({
        "mensaje": "Preferencias actualizadas.",
        "historial_id": historial.id,
        "consentimiento_activo": historial.activo,
        "compartir_red": historial.compartir_red,
        "investigacion": historial.investigacion,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def receta_pdf(request, pk):
    try:
        receta = Receta.objects.get(pk=pk)
    except Receta.DoesNotExist:
        return Response({"error": "Receta no encontrada"}, status=status.HTTP_404_NOT_FOUND)

    try:
        from fpdf import FPDF
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Helvetica", "B", 16)
        pdf.cell(0, 10, "RECETA MEDICA", ln=True, align="C")
        pdf.ln(5)
        pdf.set_font("Helvetica", "", 11)
        pdf.cell(0, 8, f"Receta Nro: {receta.id}", ln=True)
        pdf.cell(0, 8, f"Medicamento: {receta.medicamento_id}", ln=True)
        pdf.cell(0, 8, f"Intencion: {receta.intencion}", ln=True)
        pdf.cell(0, 8, f"Categoria: {receta.categoria}", ln=True)
        pdf.cell(0, 8, f"Dosis: {receta.instruccion_dosis}", ln=True)
        pdf.cell(0, 8, f"Periodo: {receta.periodo_dosis}", ln=True)
        pdf.cell(0, 8, f"Cantidad: {receta.cantidad_suministrada}", ln=True)
        pdf.cell(0, 8, f"Fecha: {receta.fecha_emitida.strftime('%d/%m/%Y %H:%M')}", ln=True)
        pdf_content = pdf.output()
        return Response(pdf_content, content_type="application/pdf")
    except ImportError:
        return Response({"error": "fpdf2 no esta instalado"}, status=status.HTTP_501_NOT_IMPLEMENTED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def recetas_list(request):
    if _is_admin(request):
        qs = Receta.objects.all()
    elif _is_medico(request):
        qs = Receta.objects.all()
    else:
        return Response({"error": "No tienes permiso"}, status=status.HTTP_403_FORBIDDEN)
    serializer = RecetaSerializer(qs, many=True)
    return Response(serializer.data)
