from rest_framework import viewsets
from .models import Mensaje
from .serializers import MensajeSerializer


class MensajeViewSet(viewsets.ModelViewSet):
    queryset = Mensaje.objects.select_related('paciente', 'medico').all()
    serializer_class = MensajeSerializer

    def get_queryset(self):
        queryset = Mensaje.objects.select_related('paciente', 'medico').all()

        paciente_id = self.request.query_params.get('paciente')
        medico_id = self.request.query_params.get('medico')
        leido = self.request.query_params.get('leido')

        if paciente_id:
            queryset = queryset.filter(paciente_id=paciente_id)

        if medico_id:
            queryset = queryset.filter(medico_id=medico_id)

        if leido is not None:
            queryset = queryset.filter(leido=leido)

        return queryset.order_by('fecha_hora')  # tipo chat cronológico