from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Mensaje
from .serializers import MensajeSerializer


def auto_respuesta(contenido: str) -> str:
    contenido_l = contenido.lower()

    if any(p in contenido_l for p in ["cita", "agendar", "reservar", "turno"]):
        return (
            "Puedes agendar una cita desde la seccion 'Citas' del menu. "
            "Selecciona especialidad, medico y horario disponible. "
            "Si necesitas ayuda adicional, un medico te contactara."
        )
    if any(p in contenido_l for p in ["horario", "atencion", "consulta"]):
        return (
            "Los horarios de atencion varian segun el hospital y especialidad. "
            "Puedes consultar los horarios disponibles al agendar una cita en la seccion 'Citas'."
        )
    if any(p in contenido_l for p in ["medicamento", "receta", "dosis", "farmacia"]):
        return (
            "Las recetas son emitidas por tu medico durante la atencion. "
            "Puedes consultar tus recetas activas en la seccion 'Mi Historial'. "
            "Para dudas sobre dosis, contacta a tu medico directamente."
        )
    if any(p in contenido_l for p in ["costo", "pago", "precio", "factura", "cuanto cuesta"]):
        return (
            "Los costos de consulta y medicamentos se calculan al finalizar la atencion. "
            "Puedes ver tus facturas en la seccion 'Facturacion'. "
            "Para informacion detallada, contacta a administracion."
        )
    if any(p in contenido_l for p in ["consentimiento", "privacidad", "datos", "informacion clinica"]):
        return (
            "Puedes gestionar tu consentimiento informado en la seccion 'Consentimiento'. "
            "Alli puedes autorizar o revocar el uso de tu informacion clinica en la red hospitalaria."
        )
    if any(p in contenido_l for p in ["doctor", "medico", "especialista", "especialidad"]):
        return (
            "Puedes ver los medicos disponibles por especialidad al agendar una cita. "
            "Cada medico muestra su especialidad, horario y ubicacion."
        )
    if any(p in contenido_l for p in ["gracias", "ayuda", "hola", "buenas", "buen dia", "buenas tardes"]):
        return (
            "¡De nada! Estoy aqui para ayudarte. Si tienes otra pregunta, no dudes en escribirme."
        )

    return "Gracias por tu mensaje. Un medico se comunicara contigo pronto."


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
            contenido=auto_respuesta(contenido),
            enviado_por='sistema',
        )

        return Response({
            "mensaje": MensajeSerializer(mensaje).data,
            "respuesta": MensajeSerializer(respuesta).data,
        }, status=status.HTTP_201_CREATED)