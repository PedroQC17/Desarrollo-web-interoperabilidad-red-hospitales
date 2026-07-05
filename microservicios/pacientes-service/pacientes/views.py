from django.http import JsonResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Paciente
from .serializers import PacienteSerializer


def health(request):
    return JsonResponse({"status": "ok", "service": "pacientes-service"})


def _is_admin(request):
    return getattr(request.user, "tipo_usuario", "") == "admin"


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
