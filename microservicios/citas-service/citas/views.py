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
        serializer = CitaSerializer(data=request.data)
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
