from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from facturacion.models import Facturacion
from facturacion.serializers import FacturacionSerializer


class FacturacionViewSet(ModelViewSet):
    queryset = Facturacion.objects.all()
    serializer_class = FacturacionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # 🔥 Filtrado por tipo de usuario
        if hasattr(user, 'paciente'):
            return Facturacion.objects.filter(
                cita__paciente=user.paciente
            )

        if hasattr(user, 'medico'):
            return Facturacion.objects.filter(
                cita__medico=user.medico
            )

        return super().get_queryset()

    # 🔥 Acción: pagar factura
    @action(detail=True, methods=['post'])
    def pagar(self, request, pk=None):
        factura = self.get_object()

        if factura.estado_pago == 'pagado':
            return Response({"msg": "La factura ya está pagada"}, status=400)

        factura.estado_pago = 'pagado'
        factura.save()

        return Response({"msg": "Pago realizado correctamente"})

    # 🔥 Acción: anular factura
    @action(detail=True, methods=['post'])
    def anular(self, request, pk=None):
        factura = self.get_object()

        if factura.estado_pago == 'pagado':
            return Response({"error": "No se puede anular una factura pagada"}, status=400)

        factura.estado_pago = 'anulado'
        factura.save()

        return Response({"msg": "Factura anulada"})