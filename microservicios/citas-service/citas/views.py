import json
import os

import httpx
from datetime import datetime
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from django.http import JsonResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import Cita, Hospital, Medico, Factura, Mensaje
from .serializers import (
    CitaSerializer, HospitalSerializer, MedicoSerializer,
    MedicoDisponibilidadSerializer, FacturaSerializer, MensajeSerializer,
)


# ── Helpers ────────────────────────────────────────────────

def health(request):
    return JsonResponse({"status": "ok", "service": "citas-service"})


def _is_admin(request):
    return getattr(request.user, "tipo_usuario", "") == "admin"


def _is_paciente(request):
    return getattr(request.user, "tipo_usuario", "") == "paciente"


def _is_medico(request):
    return getattr(request.user, "tipo_usuario", "") == "medico"


def _get_service_url(name):
    default_urls = {
        "pacientes": "http://localhost:8002",
        "medicamentos": "http://localhost:8005",
        "facturacion": "http://localhost:8006",
    }
    return os.getenv(f"SERVICE_{name.upper()}", default_urls.get(name, f"http://{name}-service:8000"))


def _proxy_headers(request):
    return {
        "X-User-Id": str(getattr(request.user, "id", "")),
        "X-User-Email": getattr(request.user, "email", ""),
        "X-User-Tipo": getattr(request.user, "tipo_usuario", ""),
        "Content-Type": "application/json",
    }


# ── CITAS ──────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def cita_list(request):
    if request.method == "GET":
        if _is_admin(request):
            queryset = Cita.objects.all()
        elif _is_paciente(request):
            queryset = Cita.objects.filter(paciente_id=request.user.id)
        elif _is_medico(request):
            queryset = Cita.objects.filter(medico__user_id=request.user.id)
        else:
            return Response({"error": "Tipo de usuario no valido"}, status=status.HTTP_403_FORBIDDEN)

        estado = request.query_params.get("estado")
        especialidad = request.query_params.get("especialidad")
        medico_id = request.query_params.get("medico_id")
        paciente_id = request.query_params.get("paciente_id")
        desde = request.query_params.get("desde")
        hasta = request.query_params.get("hasta")

        if estado:
            queryset = queryset.filter(estado=estado)
        if especialidad:
            queryset = queryset.filter(especialidad__iexact=especialidad)
        if medico_id:
            queryset = queryset.filter(medico_id=medico_id)
        if paciente_id and _is_admin(request):
            queryset = queryset.filter(paciente_id=paciente_id)
        if desde:
            queryset = queryset.filter(inicio__gte=desde)
        if hasta:
            queryset = queryset.filter(fin__lte=hasta)

        serializer = CitaSerializer(queryset, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        if not (_is_admin(request) or _is_paciente(request)):
            return Response({"error": "No tienes permiso para crear citas"}, status=status.HTTP_403_FORBIDDEN)
        data = request.data.copy()
        if _is_paciente(request):
            data["paciente_id"] = request.user.id
        if not data.get("estado"):
            data["estado"] = "pendiente"
        # Manejar "medico" como ID y como FK
        if "medico" in data and not isinstance(data.get("medico"), dict):
            data["medico"] = int(data["medico"])
        serializer = CitaSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def cita_detail(request, pk):
    try:
        cita = Cita.objects.get(pk=pk)
    except Cita.DoesNotExist:
        return Response({"error": "Cita no encontrada"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        if not _is_admin(request) and cita.paciente_id != request.user.id and cita.medico.user_id != request.user.id:
            return Response({"error": "No tienes permiso"}, status=status.HTTP_403_FORBIDDEN)
        serializer = CitaSerializer(cita)
        return Response(serializer.data)

    if request.method in ("PUT", "PATCH"):
        if not _is_admin(request):
            return Response({"error": "Solo administradores"}, status=status.HTTP_403_FORBIDDEN)
        partial = request.method == "PATCH"
        serializer = CitaSerializer(cita, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def cambiar_estado(request, pk):
    try:
        cita = Cita.objects.get(pk=pk)
    except Cita.DoesNotExist:
        return Response({"error": "Cita no encontrada"}, status=status.HTTP_404_NOT_FOUND)

    nuevo_estado = request.data.get("estado")
    if not nuevo_estado:
        return Response({"error": "Campo 'estado' requerido"}, status=status.HTTP_400_BAD_REQUEST)
    if nuevo_estado not in dict(Cita.ESTADOS):
        return Response({"error": f"Estado no valido: {nuevo_estado}"}, status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    if _is_medico(request) and cita.medico.user_id == user.id:
        if nuevo_estado not in ("confirmada", "en_curso", "completada"):
            return Response({"error": "Los medicos solo pueden confirmar, iniciar o completar citas"}, status=status.HTTP_403_FORBIDDEN)
    elif _is_paciente(request) and cita.paciente_id == user.id:
        if nuevo_estado != "cancelada":
            return Response({"error": "Los pacientes solo pueden cancelar citas"}, status=status.HTTP_403_FORBIDDEN)
    elif not _is_admin(request):
        return Response({"error": "No tienes permiso para cambiar el estado"}, status=status.HTTP_403_FORBIDDEN)

    cita.estado = nuevo_estado
    cita.save()
    serializer = CitaSerializer(cita)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mis_citas(request):
    if _is_paciente(request):
        queryset = Cita.objects.filter(paciente_id=request.user.id)
    elif _is_medico(request):
        queryset = Cita.objects.filter(medico__user_id=request.user.id)
    elif _is_admin(request):
        queryset = Cita.objects.all()
    else:
        return Response({"error": "Tipo de usuario no valido"}, status=status.HTTP_403_FORBIDDEN)

    estado = request.query_params.get("estado")
    if estado:
        queryset = queryset.filter(estado=estado)
    serializer = CitaSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mis_citas_medico(request):
    if not _is_medico(request):
        return Response({"error": "Solo medicos"}, status=status.HTTP_403_FORBIDDEN)
    queryset = Cita.objects.filter(medico__user_id=request.user.id)
    estado = request.query_params.get("estado")
    if estado:
        queryset = queryset.filter(estado=estado)
    serializer = CitaSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def citas_medico_activas(request):
    if not _is_medico(request):
        return Response({"error": "Solo médicos"}, status=status.HTTP_403_FORBIDDEN)

    queryset = Cita.objects.filter(medico_id=request.user.id, estado__in=["confirmada", "en_curso"])
    paciente_id = request.query_params.get("paciente_id")
    if paciente_id:
        queryset = queryset.filter(paciente_id=paciente_id)

    serializer = CitaSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def cita_detalle(request, pk):
    try:
        cita = Cita.objects.get(pk=pk)
    except Cita.DoesNotExist:
        return Response({"error": "Cita no encontrada"}, status=status.HTTP_404_NOT_FOUND)
    if not _is_admin(request) and cita.paciente_id != request.user.id and cita.medico.user_id != request.user.id:
        return Response({"error": "No tienes permiso"}, status=status.HTTP_403_FORBIDDEN)
    serializer = CitaSerializer(cita)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cita_diagnostico(request, pk):
    if not _is_medico(request):
        return Response({"error": "Solo medicos"}, status=status.HTTP_403_FORBIDDEN)
    try:
        cita = Cita.objects.get(pk=pk)
    except Cita.DoesNotExist:
        return Response({"error": "Cita no encontrada"}, status=status.HTTP_404_NOT_FOUND)
    url = f"{_get_service_url('pacientes')}/api/historiales/subir/"
    payload = {"paciente": cita.paciente_id, "diagnosticos": [request.data]}
    try:
        resp = httpx.post(url, json=payload, headers=_proxy_headers(request), timeout=10)
        return Response(resp.json(), status=resp.status_code)
    except httpx.RequestError as e:
        return Response({"error": f"Error comunicando con pacientes-service: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def cita_receta(request, pk):
    if not _is_medico(request):
        return Response({"error": "Solo medicos"}, status=status.HTTP_403_FORBIDDEN)
    try:
        cita = Cita.objects.get(pk=pk)
    except Cita.DoesNotExist:
        return Response({"error": "Cita no encontrada"}, status=status.HTTP_404_NOT_FOUND)
    if request.method == "GET":
        url = f"{_get_service_url('pacientes')}/api/historiales/recetas/"
        try:
            resp = httpx.get(url, headers=_proxy_headers(request), timeout=10)
            return Response(resp.json(), status=resp.status_code)
        except httpx.RequestError as e:
            return Response({"error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)
    if request.method == "POST":
        url = f"{_get_service_url('pacientes')}/api/historiales/subir/"
        payload = {"paciente": cita.paciente_id, "recetas": [request.data]}
        try:
            resp = httpx.post(url, json=payload, headers=_proxy_headers(request), timeout=10)
            return Response(resp.json(), status=resp.status_code)
        except httpx.RequestError as e:
            return Response({"error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def cita_resumen_pago(request, pk):
    if not _is_medico(request):
        return Response({"error": "Solo medicos"}, status=status.HTTP_403_FORBIDDEN)
    try:
        cita = Cita.objects.get(pk=pk)
    except Cita.DoesNotExist:
        return Response({"error": "Cita no encontrada"}, status=status.HTTP_404_NOT_FOUND)
    costo_medicamentos = 0.0
    try:
        url = f"{_get_service_url('medicamentos')}/api/medicamentos/mis-facturas/"
        resp = httpx.get(url, headers=_proxy_headers(request), timeout=10, params={"cita_id": pk})
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list) and data:
                costo_medicamentos = sum(float(item.get("total", 0)) for item in data)
    except Exception:
        pass
    monto_total = 150.0 + costo_medicamentos
    return Response({
        "cita_id": cita.id, "paciente": cita.paciente_nombre,
        "especialidad": cita.especialidad, "costo_consulta": 150.0,
        "costo_medicamentos": costo_medicamentos, "monto_total": monto_total,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cita_pagar(request, pk):
    if not _is_medico(request):
        return Response({"error": "Solo medicos"}, status=status.HTTP_403_FORBIDDEN)
    try:
        cita = Cita.objects.get(pk=pk)
    except Cita.DoesNotExist:
        return Response({"error": "Cita no encontrada"}, status=status.HTTP_404_NOT_FOUND)
    monto_total = request.data.get("monto_total", 0)
    descripcion = request.data.get("descripcion", "")
    payload = {
        "paciente_id": cita.paciente_id, "paciente_nombre": cita.paciente_nombre,
        "cita_id": cita.id, "monto_consulta": 150.0, "monto_medicamentos": 0,
        "monto_total": float(monto_total), "descripcion": descripcion,
    }
    serializer = FacturaSerializer(data=payload)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def cita_paciente(request, pk):
    try:
        cita = Cita.objects.get(pk=pk)
    except Cita.DoesNotExist:
        return Response({"error": "Cita no encontrada"}, status=status.HTTP_404_NOT_FOUND)
    historial_data = {"diagnosticos": [], "recetas": []}
    try:
        url = f"{_get_service_url('pacientes')}/api/historiales/mi-historial/"
        headers = _proxy_headers(request)
        headers["X-User-Id"] = str(cita.paciente_id)
        resp = httpx.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            historial_data["diagnosticos"] = data.get("diagnosticos", [])
            historial_data["recetas"] = data.get("recetas", [])
    except Exception:
        pass
    return Response({"historial": historial_data, "paciente_id": cita.paciente_id, "paciente_nombre": cita.paciente_nombre})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reporte_servicios(request):
    if not _is_admin(request):
        return Response({"error": "Solo administradores"}, status=status.HTTP_403_FORBIDDEN)
    queryset = Cita.objects.all()
    desde = request.query_params.get("desde")
    hasta = request.query_params.get("hasta")
    if desde:
        queryset = queryset.filter(inicio__gte=desde)
    if hasta:
        queryset = queryset.filter(inicio__lte=hasta)
    reporte = list(queryset.values("especialidad").annotate(total=Count("id")).order_by("-total"))
    return Response(reporte)


# ── MEDICOS ────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([AllowAny])
def medico_registrar(request):
    """Registra un medico desde auth-service (llamada interna)."""
    user_id = request.data.get("user_id")
    if not user_id:
        return Response({"error": "user_id requerido"}, status=status.HTTP_400_BAD_REQUEST)
    medico, created = Medico.objects.get_or_create(
        user_id=user_id,
        defaults={
            "nombre": request.data.get("nombre", ""),
            "email": request.data.get("email", ""),
            "especialidad": request.data.get("especialidad", "Medicina General"),
            "ubicacion": request.data.get("ubicacion", ""),
            "servicio_sanitario": request.data.get("servicio_sanitario", ""),
        }
    )
    if not created:
        for field in ["nombre", "email", "especialidad", "ubicacion", "servicio_sanitario"]:
            if request.data.get(field):
                setattr(medico, field, request.data[field])
        medico.save()
    serializer = MedicoSerializer(medico)
    return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def medico_list(request):
    if request.method == "GET":
        if not _is_admin(request):
            return Response({"error": "Solo administradores"}, status=status.HTTP_403_FORBIDDEN)
        serializer = MedicoSerializer(Medico.objects.all(), many=True)
        return Response(serializer.data)
    if request.method == "POST":
        if not _is_admin(request):
            return Response({"error": "Solo administradores"}, status=status.HTTP_403_FORBIDDEN)
        serializer = MedicoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def medico_detail(request, pk):
    try:
        medico = Medico.objects.get(pk=pk)
    except Medico.DoesNotExist:
        return Response({"error": "Medico no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    if request.method == "GET":
        return Response(MedicoSerializer(medico).data)
    if request.method in ("PUT", "PATCH"):
        if not _is_admin(request):
            return Response({"error": "Solo administradores"}, status=status.HTTP_403_FORBIDDEN)
        partial = request.method == "PATCH"
        serializer = MedicoSerializer(medico, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    if not _is_admin(request):
        return Response({"error": "Solo administradores"}, status=status.HTTP_403_FORBIDDEN)
    medico.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def hospitales_list(request):
    queryset = Hospital.objects.all()
    activo = request.query_params.get("activo")
    if activo == "true":
        queryset = queryset.filter(activo=True)
    elif activo == "false":
        queryset = queryset.filter(activo=False)
    return Response(HospitalSerializer(queryset, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def medicos_disponibles(request):
    queryset = Medico.objects.filter(disponibilidad=True)
    especialidad = request.query_params.get("especialidad")
    hospital_id = request.query_params.get("hospital_id")
    if especialidad:
        queryset = queryset.filter(especialidad__iexact=especialidad)
    if hospital_id:
        queryset = queryset.filter(hospital_id=hospital_id)
    return Response(MedicoSerializer(queryset, many=True).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def toggle_disponibilidad(request, pk):
    try:
        medico = Medico.objects.get(pk=pk)
    except Medico.DoesNotExist:
        return Response({"error": "Medico no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    if request.user.id != medico.user_id and not _is_admin(request):
        return Response({"error": "No tienes permiso"}, status=status.HTTP_403_FORBIDDEN)
    medico.disponibilidad = not medico.disponibilidad
    medico.save()
    return Response(MedicoDisponibilidadSerializer(medico).data)


# ── HOSPITALES ─────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def hospital_list(request):
    if request.method == "GET":
        activo = request.query_params.get("activo")
        queryset = Hospital.objects.all()
        if activo == "true":
            queryset = queryset.filter(activo=True)
        elif activo == "false":
            queryset = queryset.filter(activo=False)
        return Response(HospitalSerializer(queryset, many=True).data)
    if not _is_admin(request):
        return Response({"error": "Solo administradores"}, status=status.HTTP_403_FORBIDDEN)
    serializer = HospitalSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def hospital_detail(request, pk):
    try:
        hospital = Hospital.objects.get(pk=pk)
    except Hospital.DoesNotExist:
        return Response({"error": "Hospital no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    if request.method == "GET":
        return Response(HospitalSerializer(hospital).data)
    if request.method in ("PUT", "PATCH"):
        if not _is_admin(request):
            return Response({"error": "Solo administradores"}, status=status.HTTP_403_FORBIDDEN)
        partial = request.method == "PATCH"
        serializer = HospitalSerializer(hospital, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    if not _is_admin(request):
        return Response({"error": "Solo administradores"}, status=status.HTTP_403_FORBIDDEN)
    hospital.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def hospital_desafiliar(request, pk):
    if not _is_admin(request):
        return Response({"error": "Solo administradores"}, status=status.HTTP_403_FORBIDDEN)
    try:
        hospital = Hospital.objects.get(pk=pk)
    except Hospital.DoesNotExist:
        return Response({"error": "Hospital no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    hospital.activo = False
    hospital.fecha_desactivacion = timezone.now()
    hospital.motivo_desactivacion = request.data.get("motivo", "")
    hospital.save()
    return Response(HospitalSerializer(hospital).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def hospital_reporte(request):
    if not _is_admin(request):
        return Response({"error": "Solo administradores"}, status=status.HTTP_403_FORBIDDEN)
    queryset = Hospital.objects.all()
    desde = request.query_params.get("desde")
    hasta = request.query_params.get("hasta")
    if desde:
        queryset = queryset.filter(creado_en__gte=desde)
    if hasta:
        queryset = queryset.filter(creado_en__lte=hasta)
    return Response(HospitalSerializer(queryset, many=True).data)


# ── FACTURACION ────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def factura_list(request):
    if request.method == "GET":
        if _is_admin(request):
            queryset = Factura.objects.all()
        elif _is_paciente(request):
            queryset = Factura.objects.filter(paciente_id=request.user.id)
        else:
            return Response({"error": "No tienes permiso"}, status=status.HTTP_403_FORBIDDEN)
        pagada = request.query_params.get("pagada")
        if pagada is not None:
            queryset = queryset.filter(pagada=pagada.lower() == "true")
        return Response(FacturaSerializer(queryset, many=True).data)
    if not _is_admin(request):
        return Response({"error": "Solo administradores"}, status=status.HTTP_403_FORBIDDEN)
    serializer = FacturaSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def factura_detail(request, pk):
    try:
        factura = Factura.objects.get(pk=pk)
    except Factura.DoesNotExist:
        return Response({"error": "Factura no encontrada"}, status=status.HTTP_404_NOT_FOUND)
    if not _is_admin(request) and factura.paciente_id != request.user.id:
        return Response({"error": "No tienes permiso"}, status=status.HTTP_403_FORBIDDEN)
    return Response(FacturaSerializer(factura).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def registrar_pago(request, pk):
    try:
        factura = Factura.objects.get(pk=pk)
    except Factura.DoesNotExist:
        return Response({"error": "Factura no encontrada"}, status=status.HTTP_404_NOT_FOUND)
    if not _is_paciente(request) or factura.paciente_id != request.user.id:
        return Response({"error": "Solo el paciente puede pagar su propia factura"}, status=status.HTTP_403_FORBIDDEN)
    if factura.pagada:
        return Response({"error": "La factura ya esta pagada"}, status=status.HTTP_400_BAD_REQUEST)
    metodo = request.data.get("metodo_pago")
    if not metodo or metodo not in dict(Factura.METODO_PAGO):
        return Response({"error": "Metodo de pago no valido"}, status=status.HTTP_400_BAD_REQUEST)
    factura.pagada = True
    factura.metodo_pago = metodo
    factura.fecha_pago = timezone.now()
    factura.save()
    return Response(FacturaSerializer(factura).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mis_facturas(request):
    if not _is_paciente(request):
        return Response({"error": "Solo pacientes"}, status=status.HTTP_403_FORBIDDEN)
    queryset = Factura.objects.filter(paciente_id=request.user.id)
    pagada = request.query_params.get("pagada")
    if pagada is not None:
        queryset = queryset.filter(pagada=pagada.lower() == "true")
    return Response(FacturaSerializer(queryset, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def factura_pdf(request, pk):
    try:
        factura = Factura.objects.get(pk=pk)
    except Factura.DoesNotExist:
        return Response({"error": "Factura no encontrada"}, status=status.HTTP_404_NOT_FOUND)
    if not _is_admin(request) and factura.paciente_id != request.user.id:
        return Response({"error": "No tienes permiso"}, status=status.HTTP_403_FORBIDDEN)
    serializer = FacturaSerializer(factura)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reporte_ingresos(request):
    if not _is_admin(request):
        return Response({"error": "Solo administradores"}, status=status.HTTP_403_FORBIDDEN)
    queryset = Factura.objects.filter(pagada=True)
    desde = request.query_params.get("desde")
    hasta = request.query_params.get("hasta")
    if desde:
        queryset = queryset.filter(fecha_pago__gte=desde)
    if hasta:
        queryset = queryset.filter(fecha_pago__lte=hasta)
    reporte = list(
        queryset.annotate(fecha=TruncDate("fecha_pago"))
        .values("fecha")
        .annotate(total=Sum("monto_total"), consulta=Sum("monto_consulta"),
                   medicamentos=Sum("monto_medicamentos"), cantidad=Count("id"))
        .order_by("fecha")
    )
    return Response(reporte)


# ── MENSAJES / SOPORTE ────────────────────────────────────

def auto_respuesta(contenido):
    c = contenido.lower()
    if any(p in c for p in ["cita", "agendar", "reservar", "turno"]):
        return "Puedes agendar una cita desde la seccion 'Citas' del menu. Selecciona especialidad, medico y horario disponible."
    if any(p in c for p in ["horario", "atencion", "consulta"]):
        return "Los horarios de atencion varian segun el hospital y especialidad. Puedes consultar los horarios disponibles al agendar una cita."
    if any(p in c for p in ["medicamento", "receta", "dosis", "farmacia"]):
        return "Las recetas son emitidas por tu medico durante la atencion. Puedes consultar tus recetas activas en la seccion 'Mi Historial'."
    if any(p in c for p in ["costo", "pago", "precio", "factura"]):
        return "Los costos de consulta y medicamentos se calculan al finalizar la atencion. Puedes ver tus facturas en la seccion 'Facturacion'."
    if any(p in c for p in ["doctor", "medico", "especialista"]):
        return "Puedes ver los medicos disponibles por especialidad al agendar una cita."
    if any(p in c for p in ["gracias", "ayuda", "hola", "buenas"]):
        return "¡De nada! Estoy aqui para ayudarte. Si tienes otra pregunta, no dudes en escribirme."
    return "Gracias por tu mensaje. Un medico se comunicara contigo pronto."


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def mensaje_list(request):
    if request.method == "GET":
        user_id = request.user.id
        tipo = _get_tipo(request)
        qs = Mensaje.objects.all()
        if tipo == "paciente":
            qs = qs.filter(paciente_id=user_id)
        elif tipo == "medico":
            qs = qs.filter(medico__user_id=user_id)
        elif tipo != "admin":
            return Response({"error": "No tienes permisos"}, status=status.HTTP_403_FORBIDDEN)
        return Response(MensajeSerializer(qs, many=True).data)

    tipo = _get_tipo(request)
    if tipo != "paciente":
        return Response({"error": "Solo los pacientes pueden enviar mensajes"}, status=status.HTTP_403_FORBIDDEN)
    contenido = request.data.get("contenido", "").strip()
    if not contenido:
        return Response({"error": "El mensaje no puede estar vacio"}, status=status.HTTP_400_BAD_REQUEST)
    user_id = request.user.id
    email = getattr(request.user, "email", "")
    nombre = email.split("@")[0] if email else f"Paciente #{user_id}"
    mensaje = Mensaje.objects.create(paciente_id=user_id, paciente_nombre=nombre, contenido=contenido, enviado_por="paciente")
    resp = auto_respuesta(contenido)
    respuesta = Mensaje.objects.create(paciente_id=user_id, paciente_nombre=nombre, contenido=resp, enviado_por="sistema")
    return Response({"mensaje": MensajeSerializer(mensaje).data, "respuesta": MensajeSerializer(respuesta).data}, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mensaje_detail(request, pk):
    try:
        msg = Mensaje.objects.get(pk=pk)
    except Mensaje.DoesNotExist:
        return Response({"error": "Mensaje no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    user_id = request.user.id
    tipo = _get_tipo(request)
    if tipo == "paciente" and msg.paciente_id != user_id:
        return Response({"error": "No tienes permisos"}, status=status.HTTP_403_FORBIDDEN)
    if tipo == "medico":
        if msg.medico and msg.medico.user_id != user_id:
            return Response({"error": "No tienes permisos"}, status=status.HTTP_403_FORBIDDEN)
        if msg.paciente_id and msg.paciente_id != user_id:
            return Response({"error": "No tienes permisos"}, status=status.HTTP_403_FORBIDDEN)
    return Response(MensajeSerializer(msg).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def marcar_leido(request, pk):
    try:
        msg = Mensaje.objects.get(pk=pk)
    except Mensaje.DoesNotExist:
        return Response({"error": "Mensaje no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    tipo = _get_tipo(request)
    if tipo not in ("medico", "admin"):
        return Response({"error": "Solo medicos o administradores"}, status=status.HTTP_403_FORBIDDEN)
    msg.leido = True
    msg.save()
    return Response(MensajeSerializer(msg).data)


def _get_tipo(request):
    return getattr(request.user, "tipo_usuario", "")
