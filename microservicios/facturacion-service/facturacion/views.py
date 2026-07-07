from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Factura
from .serializers import FacturaSerializer


def health(request):
    return JsonResponse({"status": "ok", "service": "facturacion-service"})


def _is_admin(request):
    return getattr(request.user, "tipo_usuario", "") == "admin"


def _is_paciente(request):
    return getattr(request.user, "tipo_usuario", "") == "paciente"


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

        serializer = FacturaSerializer(queryset, many=True)
        return Response(serializer.data)

    if request.method == "POST":
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

    serializer = FacturaSerializer(factura)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def factura_pdf(request, pk):
    try:
        factura = Factura.objects.get(pk=pk)
    except Factura.DoesNotExist:
        return Response({"error": "Factura no encontrada"}, status=status.HTTP_404_NOT_FOUND)

    if not _is_admin(request) and factura.paciente_id != request.user.id:
        return Response({"error": "No tienes permiso"}, status=status.HTTP_403_FORBIDDEN)

    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Factura #{factura.id}</title>
<style>
  body {{ font-family: Arial; padding: 40px; }}
  h1 {{ color: #2563eb; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
  th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
  th {{ background: #f3f4f6; }}
  .total {{ font-size: 18px; font-weight: bold; margin-top: 20px; }}
</style></head><body>
<h1>Factura #{factura.id}</h1>
<p><strong>Paciente:</strong> {factura.paciente_nombre or 'N/A'}</p>
<p><strong>Fecha:</strong> {factura.fecha_emision or factura.fecha_creacion}</p>
<p><strong>Estado:</strong> {'Pagada' if factura.pagada else 'Pendiente'}</p>
<table>
<tr><th>Concepto</th><th>Monto</th></tr>
<tr><td>Consulta</td><td>S/ {float(factura.monto_consulta or 0):.2f}</td></tr>
<tr><td>Medicamentos</td><td>S/ {float(factura.monto_medicamentos or 0):.2f}</td></tr>
</table>
<p class="total">Total: S/ {float(factura.monto_total or 0):.2f}</p>
</body></html>"""
    return HttpResponse(html, content_type="text/html; charset=utf-8",
                        headers={"Content-Disposition": f'inline; filename="factura_{factura.id}.html"'})


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
        return Response({"error": "La factura ya está pagada"}, status=status.HTTP_400_BAD_REQUEST)

    metodo = request.data.get("metodo_pago")
    if not metodo or metodo not in dict(Factura.METODO_PAGO):
        return Response({"error": "Método de pago no válido"}, status=status.HTTP_400_BAD_REQUEST)

    factura.pagada = True
    factura.metodo_pago = metodo
    factura.fecha_pago = timezone.now()
    factura.save()

    serializer = FacturaSerializer(factura)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mis_facturas(request):
    if not _is_paciente(request):
        return Response({"error": "Solo pacientes"}, status=status.HTTP_403_FORBIDDEN)

    queryset = Factura.objects.filter(paciente_id=request.user.id)

    pagada = request.query_params.get("pagada")
    if pagada is not None:
        queryset = queryset.filter(pagada=pagada.lower() == "true")

    serializer = FacturaSerializer(queryset, many=True)
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

    reporte = (
        queryset.annotate(fecha=TruncDate("fecha_pago"))
        .values("fecha")
        .annotate(
            total=Sum("monto_total"),
            consulta=Sum("monto_consulta"),
            medicamentos=Sum("monto_medicamentos"),
            cantidad=Sum("monto_total") / Sum("monto_total"),  # count approximation
        )
        .order_by("fecha")
    )

    # rebuild with proper count
    from django.db.models import Count

    reporte = (
        queryset.annotate(fecha=TruncDate("fecha_pago"))
        .values("fecha")
        .annotate(
            total=Sum("monto_total"),
            consulta=Sum("monto_consulta"),
            medicamentos=Sum("monto_medicamentos"),
            cantidad=Count("id"),
        )
        .order_by("fecha")
    )

    return Response(list(reporte))
