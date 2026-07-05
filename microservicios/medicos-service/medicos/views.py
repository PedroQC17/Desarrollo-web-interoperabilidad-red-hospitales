from django.http import JsonResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Medico
from .serializers import MedicoSerializer, MedicoDisponibilidadSerializer


def health(request):
    return JsonResponse({"status": "ok", "service": "medicos-service"})


def _is_admin(request):
    return getattr(request.user, "tipo_usuario", "") == "admin"


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def medico_list(request):
    if request.method == "GET":
        if not _is_admin(request):
            return Response({"error": "Solo administradores"}, status=status.HTTP_403_FORBIDDEN)
        queryset = Medico.objects.all()
        serializer = MedicoSerializer(queryset, many=True)
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
        return Response({"error": "Médico no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        serializer = MedicoSerializer(medico)
        return Response(serializer.data)

    if request.method in ("PUT", "PATCH"):
        if not _is_admin(request):
            return Response({"error": "Solo administradores"}, status=status.HTTP_403_FORBIDDEN)
        partial = request.method == "PATCH"
        serializer = MedicoSerializer(medico, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    if request.method == "DELETE":
        if not _is_admin(request):
            return Response({"error": "Solo administradores"}, status=status.HTTP_403_FORBIDDEN)
        medico.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


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
    serializer = MedicoSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def toggle_disponibilidad(request, pk):
    try:
        medico = Medico.objects.get(pk=pk)
    except Medico.DoesNotExist:
        return Response({"error": "Médico no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    if request.user.id != medico.user_id and not _is_admin(request):
        return Response({"error": "No tienes permiso"}, status=status.HTTP_403_FORBIDDEN)

    medico.disponibilidad = not medico.disponibilidad
    medico.save()
    serializer = MedicoDisponibilidadSerializer(medico)
    return Response(serializer.data)
