from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Mensaje
from .serializers import MensajeSerializer


class MensajeViewSet(viewsets.ModelViewSet):
    queryset = Mensaje.objects.select_related('paciente', 'medico').all()
    serializer_class = MensajeSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Mensaje.objects.select_related('paciente', 'medico').all()

        if hasattr(user, 'paciente'):
            qs = qs.filter(paciente=user.paciente)
        elif hasattr(user, 'medico'):
            qs = qs.filter(medico=user.medico)

        return qs.order_by('fecha_hora')

    def create(self, request, *args, **kwargs):
        contenido = request.data.get('contenido', '').strip()
        if not contenido:
            return Response({"error": "El mensaje no puede estar vacio."}, status=status.HTTP_400_BAD_REQUEST)

        if not hasattr(request.user, 'paciente'):
            return Response({"error": "Solo los pacientes pueden enviar mensajes."}, status=status.HTTP_403_FORBIDDEN)

        mensaje = Mensaje.objects.create(
            paciente=request.user.paciente,
            contenido=contenido,
            enviado_por='paciente',
        )

        respuesta = Mensaje.objects.create(
            paciente=request.user.paciente,
            contenido="Gracias por tu mensaje. Un medico se comunicara contigo pronto.",
            enviado_por='sistema',
        )

        return Response({
            "mensaje": MensajeSerializer(mensaje).data,
            "respuesta": MensajeSerializer(respuesta).data,
        }, status=status.HTTP_201_CREATED)