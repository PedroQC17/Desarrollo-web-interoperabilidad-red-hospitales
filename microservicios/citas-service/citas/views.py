import json
import os

import httpx
from django.http import JsonResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Cita
from .serializers import CitaSerializer


def health(request):
    return JsonResponse({"status": "ok", "service": "citas-service"})


def _is_admin(request):
    return getattr(request.user, "tipo_usuario", "") == "admin"


def _is_paciente(request):
    return getattr(request.user, "tipo_usuario", "") == "paciente"


def _is_medico(request):
    return getattr(request.user, "tipo_usuario", "") == "medico"


def _get_service_url(name):
    env_key = f"SERVICE_{name.upper()}"
    default_urls = {
        "pacientes": "http://pacientes-service:8002",
        "medicos": "http://medicos-service:8003",
        "medicamentos": "http://medicamentos-service:8005",
        "facturacion": "http://facturacion-service:8006",
    }
    return os.getenv(env_key, default_urls.get(name, f"http://{name}-service:8000"))


def _proxy_headers(request):
    return {
        "X-User-Id": str(getattr(request.user, "id", "")),
        "X-User-Email": getattr(request.user, "email", ""),
        "X-User-Tipo": getattr(request.user, "tipo_usuario", ""),
        "Content-Type": "application/json",
    }


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def cita_list(request):
    if request.method == "GET":
        if _is_admin(request):
            queryset = Cita.objects.all()
        elif _is_paciente(request):
            queryset = Cita.objects.filter(paciente_id=request.user.id)
        elif _is_medico(request):
            queryset = Cita.objects.filter(medico_id=request.user.id)
        else:
            return Response({"error": "Tipo de usuario no válido"}, status=status.HTTP_403_FORBIDDEN)

        # Filtros opcionales
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
        if not _is_admin(request) and cita.paciente_id != request.user.id and cita.medico_id != request.user.id:
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
        return Response({"error": f"Estado no válido: {nuevo_estado}"}, status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    es_admin = _is_admin(request)
    es_medico = _is_medico(request)
    es_paciente = _is_paciente(request)

    # Médico: confirmar, en_curso, completar
    if es_medico and cita.medico_id == user.id:
        if nuevo_estado not in ("confirmada", "en_curso", "completada"):
            return Response({"error": "Los médicos solo pueden confirmar, iniciar o completar citas"}, status=status.HTTP_403_FORBIDDEN)
    elif es_paciente and cita.paciente_id == user.id:
        if nuevo_estado != "cancelada":
            return Response({"error": "Los pacientes solo pueden cancelar citas"}, status=status.HTTP_403_FORBIDDEN)
    elif not es_admin:
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
        queryset = Cita.objects.filter(medico_id=request.user.id)
    elif _is_admin(request):
        queryset = Cita.objects.all()
    else:
        return Response({"error": "Tipo de usuario no válido"}, status=status.HTTP_403_FORBIDDEN)

    estado = request.query_params.get("estado")
    if estado:
        queryset = queryset.filter(estado=estado)

    serializer = CitaSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mis_citas_medico(request):
    if not _is_medico(request):
        return Response({"error": "Solo médicos"}, status=status.HTTP_403_FORBIDDEN)

    queryset = Cita.objects.filter(medico_id=request.user.id)
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

    if not _is_admin(request) and cita.paciente_id != request.user.id and cita.medico_id != request.user.id:
        return Response({"error": "No tienes permiso"}, status=status.HTTP_403_FORBIDDEN)

    serializer = CitaSerializer(cita)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cita_diagnostico(request, pk):
    if not _is_medico(request):
        return Response({"error": "Solo médicos"}, status=status.HTTP_403_FORBIDDEN)

    try:
        cita = Cita.objects.get(pk=pk)
    except Cita.DoesNotExist:
        return Response({"error": "Cita no encontrada"}, status=status.HTTP_404_NOT_FOUND)

    url = _get_service_url("pacientes").rstrip("/") + "/api/historiales/subir/"
    payload = {
        "paciente": cita.paciente_id,
        "diagnosticos": [request.data],
    }
    try:
        resp = httpx.post(url, json=payload, headers=_proxy_headers(request), timeout=10)
        return Response(resp.json(), status=resp.status_code)
    except httpx.RequestError as e:
        return Response({"error": f"Error comunicando con pacientes-service: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def cita_receta(request, pk):
    if not _is_medico(request):
        return Response({"error": "Solo médicos"}, status=status.HTTP_403_FORBIDDEN)

    try:
        cita = Cita.objects.get(pk=pk)
    except Cita.DoesNotExist:
        return Response({"error": "Cita no encontrada"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        url = _get_service_url("pacientes").rstrip("/") + "/api/historiales/recetas/"
        try:
            resp = httpx.get(url, headers=_proxy_headers(request), timeout=10)
            return Response(resp.json(), status=resp.status_code)
        except httpx.RequestError as e:
            return Response({"error": f"Error comunicando con pacientes-service: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)

    if request.method == "POST":
        url = _get_service_url("pacientes").rstrip("/") + "/api/historiales/subir/"
        payload = {
            "paciente": cita.paciente_id,
            "recetas": [request.data],
        }
        try:
            resp = httpx.post(url, json=payload, headers=_proxy_headers(request), timeout=10)
            return Response(resp.json(), status=resp.status_code)
        except httpx.RequestError as e:
            return Response({"error": f"Error comunicando con pacientes-service: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def cita_resumen_pago(request, pk):
    if not _is_medico(request):
        return Response({"error": "Solo médicos"}, status=status.HTTP_403_FORBIDDEN)

    try:
        cita = Cita.objects.get(pk=pk)
    except Cita.DoesNotExist:
        return Response({"error": "Cita no encontrada"}, status=status.HTTP_404_NOT_FOUND)

    costo_consulta = 150.0
    costo_medicamentos = 0.0
    medicamentos_list = []

    try:
        url = _get_service_url("medicamentos").rstrip("/") + "/api/medicamentos/mis-facturas/"
        resp = httpx.get(url, headers=_proxy_headers(request), timeout=10, params={"cita_id": pk})
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list) and data:
                costo_medicamentos = sum(float(item.get("total", 0)) for item in data)
    except Exception:
        pass

    monto_total = costo_consulta + costo_medicamentos

    return Response({
        "cita_id": cita.id,
        "paciente": cita.paciente_nombre,
        "especialidad": cita.especialidad,
        "costo_consulta": costo_consulta,
        "medicamentos": medicamentos_list,
        "costo_medicamentos": costo_medicamentos,
        "monto_total": monto_total,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cita_pagar(request, pk):
    if not _is_medico(request):
        return Response({"error": "Solo médicos"}, status=status.HTTP_403_FORBIDDEN)

    try:
        cita = Cita.objects.get(pk=pk)
    except Cita.DoesNotExist:
        return Response({"error": "Cita no encontrada"}, status=status.HTTP_404_NOT_FOUND)

    monto_total = request.data.get("monto_total", 0)
    descripcion = request.data.get("descripcion", "")

    url = _get_service_url("facturacion").rstrip("/") + "/api/facturacion/"
    payload = {
        "paciente_id": cita.paciente_id,
        "paciente_nombre": cita.paciente_nombre,
        "cita_id": cita.id,
        "monto_consulta": 150.0,
        "monto_medicamentos": 0,
        "monto_total": float(monto_total),
        "descripcion": descripcion,
    }
    try:
        resp = httpx.post(url, json=payload, headers=_proxy_headers(request), timeout=10)
        return Response(resp.json(), status=resp.status_code)
    except httpx.RequestError as e:
        return Response({"error": f"Error comunicando con facturacion-service: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def cita_paciente(request, pk):
    try:
        cita = Cita.objects.get(pk=pk)
    except Cita.DoesNotExist:
        return Response({"error": "Cita no encontrada"}, status=status.HTTP_404_NOT_FOUND)

    historial_data = {"diagnosticos": [], "recetas": []}
    try:
        url = _get_service_url("pacientes").rstrip("/") + "/api/historiales/mi-historial/"
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

    from django.db.models import Count
    queryset = Cita.objects.all()
    desde = request.query_params.get("desde")
    hasta = request.query_params.get("hasta")
    if desde:
        queryset = queryset.filter(inicio__gte=desde)
    if hasta:
        queryset = queryset.filter(inicio__lte=hasta)

    reporte = list(
        queryset.values("especialidad")
        .annotate(total=Count("id"))
        .order_by("-total")
    )
    return Response(reporte)
