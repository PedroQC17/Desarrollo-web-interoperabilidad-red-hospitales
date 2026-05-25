from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

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
    

    #Funciones para la atencion medica

from citas.models import Cita
from historial.models import Receta

from facturacion.models import Facturacion
from facturacion.serializers import FacturacionSerializer

from services.gestion_medicos.gestion_atencion import (
    registrar_pago,

)

class GenerarPagoView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            cita = Cita.objects.get(id=request.data.get('cita'))
        except Cita.DoesNotExist:
            return Response(
                {"error": "Cita no encontrada."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verificar que el usuario sea médico (solo médicos pueden registrar pagos)
        if not hasattr(request.user, 'medico'):
            return Response(
                {"error": "Solo los médicos pueden registrar pagos."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            factura = registrar_pago(
                medico=request.user.medico,
                cita_id=cita.id,
                datos={
                    'descripcion': request.data.get('descripcion', 'Servicio médico'),
                    'monto_total': request.data.get('monto_total')
                }
            )
            serializer = FacturacionSerializer(factura)
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )
        except (ValueError, PermissionError) as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
