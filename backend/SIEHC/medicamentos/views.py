from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework import status

from .models import Medicamento, Despacho
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