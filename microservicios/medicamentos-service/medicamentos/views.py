from django.http import JsonResponse
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Medicamento, Despacho, DespachoItem
from .serializers import (
    MedicamentoSerializer,
    DespachoInputSerializer,
    DespachoSerializer,
)


def health(request):
    return JsonResponse({"status": "ok", "service": "medicamentos-service"})


def _get_tipo(request):
    return getattr(request.user, "tipo_usuario", "")


def _get_id(request):
    return request.user.id if hasattr(request.user, "id") else None


# ── Medicamento CRUD ────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def medicamento_list(request):
    if request.method == "POST":
        if _get_tipo(request) != "admin":
            return Response({"error": "Solo administradores"}, status=status.HTTP_403_FORBIDDEN)
        serializer = MedicamentoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    qs = Medicamento.objects.all()
    hospital_id = request.query_params.get("hospital_id")
    tipo = request.query_params.get("tipo")
    nombre = request.query_params.get("nombre")
    solo_activos = request.query_params.get("activos", "true").lower() == "true"

    if solo_activos:
        qs = qs.filter(activo=True)
    if hospital_id:
        qs = qs.filter(hospital_id=hospital_id)
    if tipo:
        qs = qs.filter(tipo=tipo)
    if nombre:
        qs = qs.filter(nombre__icontains=nombre)

    serializer = MedicamentoSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def medicamento_detail(request, pk):
    try:
        med = Medicamento.objects.get(pk=pk)
    except Medicamento.DoesNotExist:
        return Response({"error": "Medicamento no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        serializer = MedicamentoSerializer(med)
        return Response(serializer.data)

    if _get_tipo(request) != "admin":
        return Response({"error": "Solo administradores"}, status=status.HTTP_403_FORBIDDEN)

    if request.method in ("PUT", "PATCH"):
        serializer = MedicamentoSerializer(med, data=request.data, partial=(request.method == "PATCH"))
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    med.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ── Despachar medicamentos ──────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def despachar(request):
    if _get_tipo(request) != "medico":
        return Response({"error": "Solo médicos pueden despachar"}, status=status.HTTP_403_FORBIDDEN)

    serializer = DespachoInputSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    cita_id = serializer.validated_data["cita_id"]
    paciente_id = serializer.validated_data["paciente_id"]
    paciente_nombre = serializer.validated_data.get("paciente_nombre", "")
    items_data = serializer.validated_data["items"]

    if Despacho.objects.filter(cita_id=cita_id).exists():
        return Response({"error": "Esta cita ya tiene un despacho"}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        despacho = Despacho.objects.create(
            medico_id=_get_id(request),
            paciente_id=paciente_id,
            paciente_nombre=paciente_nombre,
            cita_id=cita_id,
        )

        for item in items_data:
            try:
                med = Medicamento.objects.select_for_update().get(pk=item["medicamento_id"])
            except Medicamento.DoesNotExist:
                raise ValueError(f"Medicamento {item['medicamento_id']} no encontrado")

            if not med.hay_stock(item["cantidad"]):
                raise ValueError(f"Stock insuficiente para {med.nombre}")

            med.stock -= item["cantidad"]
            med.save()

            DespachoItem.objects.create(
                despacho=despacho,
                medicamento_id=med.id,
                medicamento_nombre=med.nombre,
                cantidad=item["cantidad"],
                precio_unitario=med.costo,
            )

        despacho.calcular_total()

    output_ser = DespachoSerializer(despacho)
    return Response(output_ser.data, status=status.HTTP_201_CREATED)


# ── Mis despachos (médico) ──────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mis_despachos(request):
    if _get_tipo(request) != "medico":
        return Response({"error": "Solo médicos"}, status=status.HTTP_403_FORBIDDEN)

    qs = Despacho.objects.filter(medico_id=_get_id(request)).prefetch_related("items")
    serializer = DespachoSerializer(qs, many=True)
    return Response(serializer.data)


# ── Mis facturas (paciente) ─────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mis_facturas(request):
    user_id = _get_id(request)
    tipo = _get_tipo(request)
    if tipo == "paciente":
        qs = Despacho.objects.filter(paciente_id=user_id).prefetch_related("items")
    else:
        qs = Despacho.objects.prefetch_related("items").all()
    serializer = DespachoSerializer(qs, many=True)
    return Response(serializer.data)
