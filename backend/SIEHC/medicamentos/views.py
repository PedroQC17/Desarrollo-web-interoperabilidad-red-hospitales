from io import BytesIO
from django.http import HttpResponse
from fpdf import FPDF
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework import status

from .models import Medicamento, Despacho, DespachoItem
from .serializers import MedicamentoSerializer, DespachoInputSerializer, DespachoSerializer
from services.gestion_medicos.gestion_atencion import (
    catalogo_medicamentos,
    despachar_medicamentos,
)


# ─────────────────────────────────────────────────────────────────────────────
#  PERMISO LOCAL
# ─────────────────────────────────────────────────────────────────────────────

class EsMedico(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.tipo_usuario == "medico"


# ─────────────────────────────────────────────────────────────────────────────
#  PAGINACIÓN
# ─────────────────────────────────────────────────────────────────────────────

class MedicamentoPagination(PageNumberPagination):
    page_size             = 20
    page_size_query_param = "page_size"
    max_page_size         = 100


# ─────────────────────────────────────────────────────────────────────────────
#  VIEWSET EXISTENTE — CRUD completo (sin cambios)
# ─────────────────────────────────────────────────────────────────────────────

class MedicamentoViewSet(viewsets.ModelViewSet):
    queryset         = Medicamento.objects.select_related("hospital").filter(activo=True)
    serializer_class = MedicamentoSerializer

    def get_queryset(self):
        queryset    = Medicamento.objects.select_related("hospital").filter(activo=True)
        hospital_id = self.request.query_params.get("hospital")
        tipo        = self.request.query_params.get("tipo")
        activo      = self.request.query_params.get("activo")

        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        if activo is not None:
            queryset = queryset.filter(activo=activo)

        return queryset


# ─────────────────────────────────────────────────────────────────────────────
#  HU11 — CATÁLOGO PAGINADO (médico)
#  GET /api/medicamentos/catalogo/
#  Query params: ?nombre=<texto>&tipo=<tipo>&hospital=<id>&page=<n>
# ─────────────────────────────────────────────────────────────────────────────

class CatalogoMedicamentosView(APIView):
    """
    HU11 — Catálogo paginado de medicamentos activos.
    Permite buscar por nombre genérico o comercial y filtrar por tipo.
    """
    permission_classes = [IsAuthenticated]
    pagination_class   = MedicamentoPagination

    def get(self, request):
        hospital_id = request.query_params.get("hospital")
        nombre      = request.query_params.get("nombre")
        tipo        = request.query_params.get("tipo")

        qs         = catalogo_medicamentos(hospital_id=hospital_id, nombre=nombre, tipo=tipo)
        paginator  = self.pagination_class()
        page       = paginator.paginate_queryset(qs, request)
        serializer = MedicamentoSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


# ─────────────────────────────────────────────────────────────────────────────
#  HU12 — DESPACHAR MEDICAMENTOS (médico)
#  POST /api/medicamentos/despachar/<cita_pk>/
# ─────────────────────────────────────────────────────────────────────────────

class DespacharMedicamentosView(APIView):
    """
    HU12 — El médico despacha medicamentos para una cita.
    Descuenta stock con select_for_update (evita condición de carrera).

    Body JSON:
    {
        "items": [
            { "medicamento": <int: id>, "cantidad": <int> },
            ...
        ]
    }
    """
    permission_classes = [EsMedico]

    def post(self, request, cita_pk):
        input_ser = DespachoInputSerializer(data=request.data)
        if not input_ser.is_valid():
            return Response(input_ser.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            resumen = despachar_medicamentos(
                request.user.medico,
                cita_pk,
                input_ser.validated_data["items"],
            )
            return Response(
                {"mensaje": "Medicamentos despachados correctamente.", "resumen": resumen},
                status=status.HTTP_200_OK,
            )
        except PermissionError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────────────────────
#  HU12+ — LISTAR DESPACHOS DEL MÉDICO
#  GET /api/medicamentos/mis-despachos/
# ─────────────────────────────────────────────────────────────────────────────

class MisDespachoView(APIView):
    """
    HU12+ — Lista todos los despachos realizados por el médico autenticado.
    Paginado y ordenado por fecha descendente.
    """
    permission_classes = [EsMedico]
    pagination_class   = MedicamentoPagination

    def get(self, request):
        """Retorna los despachos del médico autenticado."""
        despachos = Despacho.objects.filter(medico=request.user.medico).prefetch_related('items').order_by('-fecha_despacho')
        paginator = self.pagination_class()
        page      = paginator.paginate_queryset(despachos, request)
        serializer = DespachoSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


# ─────────────────────────────────────────────────────────────────────────────
#  HU20 — PDF de despacho de medicamentos
#  GET /api/medicamentos/despacho/<pk>/pdf/
# ─────────────────────────────────────────────────────────────────────────────

class DespachoPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            despacho = Despacho.objects.prefetch_related('items__medicamento').select_related(
                'cita__paciente__usuario', 'medico__usuario', 'medico__hospital'
            ).get(pk=pk)
        except Despacho.DoesNotExist:
            return Response({"error": "Despacho no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        cita = despacho.cita
        hospital = despacho.medico.hospital.nombre if despacho.medico and despacho.medico.hospital else "—"
        medico_nombre = despacho.medico.usuario.nombre if despacho.medico else "—"
        paciente_nombre = cita.paciente.usuario.nombre if cita and cita.paciente else "—"

        pdf = FPDF()
        pdf.add_page()
        pdf.set_font('Helvetica', 'B', 18)
        pdf.cell(0, 12, 'SIEHC - Factura de Medicamentos', new_x='LMARGIN', new_y='NEXT', align='C')
        pdf.ln(6)

        pdf.set_font('Helvetica', '', 10)
        items = [
            ('Despacho N.', f'#DES-{despacho.id}'),
            ('Hospital', hospital),
            ('Paciente', paciente_nombre),
            ('Medico', medico_nombre),
            ('Fecha', despacho.fecha_despacho.strftime('%d/%m/%Y %H:%M')),
        ]
        for label, value in items:
            pdf.set_font('Helvetica', 'B', 10)
            pdf.cell(35, 7, label + ':', border=1)
            pdf.set_font('Helvetica', '', 10)
            pdf.cell(0, 7, str(value), border=1, new_x='LMARGIN', new_y='NEXT')

        pdf.ln(6)
        col_w = [10, 80, 30, 30, 40]
        headers = ['N.', 'Medicamento', 'Cant.', 'P.Unit.', 'Subtotal']
        pdf.set_font('Helvetica', 'B', 10)
        pdf.set_fill_color(230, 230, 230)
        for i, h in enumerate(headers):
            pdf.cell(col_w[i], 8, h, border=1, align='C', fill=True)
        pdf.ln()

        pdf.set_font('Helvetica', '', 10)
        for idx, item in enumerate(despacho.items.all(), 1):
            pdf.cell(col_w[0], 7, str(idx), border=1, align='C')
            pdf.cell(col_w[1], 7, item.medicamento.nombre, border=1)
            pdf.cell(col_w[2], 7, str(item.cantidad), border=1, align='C')
            pdf.cell(col_w[3], 7, f'S/ {float(item.precio_unitario):.2f}', border=1, align='R')
            pdf.cell(col_w[4], 7, f'S/ {float(item.subtotal):.2f}', border=1, align='R')
            pdf.ln()

        pdf.set_font('Helvetica', 'B', 10)
        pdf.cell(sum(col_w[:4]), 8, 'Total', border=1, align='R')
        pdf.cell(col_w[4], 8, f'S/ {float(despacho.total):.2f}', border=1, align='R')

        buf = BytesIO()
        pdf.output(buf)
        buf.seek(0)
        return HttpResponse(buf, content_type='application/pdf',
                            headers={'Content-Disposition': f'attachment; filename="despacho_{despacho.id}.pdf"'})


# ─────────────────────────────────────────────────────────────────────────────
#  HU17 — REPORTE DE VENTAS DE MEDICAMENTOS (admin)
#  GET /api/medicamentos/reporte-ventas/?desde=&hasta=&hospital=
# ─────────────────────────────────────────────────────────────────────────────

class ReporteVentasMedicamentosView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Sum, Count
        desde = request.query_params.get('desde')
        hasta = request.query_params.get('hasta')
        hospital_id = request.query_params.get('hospital')

        items = DespachoItem.objects.select_related(
            'despacho__cita__medico__usuario__medico__hospital',
            'medicamento'
        )

        if desde:
            items = items.filter(despacho__fecha_despacho__gte=desde)
        if hasta:
            items = items.filter(despacho__fecha_despacho__lte=hasta)

        # Ingresos por hospital
        ingresos_por_hospital = items.values(
            'despacho__cita__medico__usuario__medico__hospital__id',
            'despacho__cita__medico__usuario__medico__hospital__nombre',
        ).annotate(
            total_ingresos=Sum('subtotal'),
            total_ventas=Count('id')
        ).order_by('-total_ingresos')

        # Medicamentos más vendidos (top 10 general)
        mas_vendidos = items.values(
            'medicamento__nombre',
            'medicamento__tipo',
        ).annotate(
            total_vendido=Sum('cantidad'),
            total_ingresos=Sum('subtotal')
        ).order_by('-total_vendido')[:10]

        return Response({
            'por_hospital': ingresos_por_hospital,
            'mas_vendidos': mas_vendidos,
        })


# ─────────────────────────────────────────────────────────────────────────────
#  PACIENTE — LISTAR DESPACHOS/FACTURAS DE MEDICAMENTOS
#  GET /api/medicamentos/mis-facturas-medicamentos/
# ─────────────────────────────────────────────────────────────────────────────

class MisFacturasMedicamentosView(APIView):
    """
    Paciente — Lista todas las facturas de medicamentos (despachos) del paciente.
    Paginado y ordenado por fecha descendente.
    """
    permission_classes = [IsAuthenticated]
    pagination_class   = MedicamentoPagination

    def get(self, request):
        """Retorna los despachos/facturas de medicamentos del paciente autenticado."""
        if not hasattr(request.user, 'paciente'):
            return Response(
                {"error": "Solo los pacientes pueden acceder a sus facturas de medicamentos"},
                status=status.HTTP_403_FORBIDDEN
            )

        despachos = Despacho.objects.filter(
            cita__paciente=request.user.paciente
        ).prefetch_related('items').order_by('-fecha_despacho')
        
        paginator = self.pagination_class()
        page      = paginator.paginate_queryset(despachos, request)
        serializer = DespachoSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)