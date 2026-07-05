from django.http import JsonResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Mensaje
from .serializers import MensajeSerializer


def health(request):
    return JsonResponse({"status": "ok", "service": "soporte-service"})


def auto_respuesta(contenido):
    c = contenido.lower()
    if any(p in c for p in ["cita", "agendar", "reservar", "turno"]):
        return (
            "Puedes agendar una cita desde la sección 'Citas' del menú. "
            "Selecciona especialidad, médico y horario disponible. "
            "Si necesitas ayuda adicional, un médico te contactará."
        )
    if any(p in c for p in ["horario", "atencion", "consulta"]):
        return (
            "Los horarios de atención varían según el hospital y especialidad. "
            "Puedes consultar los horarios disponibles al agendar una cita."
        )
    if any(p in c for p in ["medicamento", "receta", "dosis", "farmacia"]):
        return (
            "Las recetas son emitidas por tu médico durante la atención. "
            "Puedes consultar tus recetas activas en la sección 'Mi Historial'. "
            "Para dudas sobre dosis, contacta a tu médico directamente."
        )
    if any(p in c for p in ["costo", "pago", "precio", "factura", "cuanto cuesta"]):
        return (
            "Los costos de consulta y medicamentos se calculan al finalizar la atención. "
            "Puedes ver tus facturas en la sección 'Facturación'. "
            "Para información detallada, contacta a administración."
        )
    if any(p in c for p in ["doctor", "medico", "especialista", "especialidad"]):
        return (
            "Puedes ver los médicos disponibles por especialidad al agendar una cita. "
            "Cada médico muestra su especialidad, horario y ubicación."
        )
    if any(p in c for p in ["gracias", "ayuda", "hola", "buenas"]):
        return "¡De nada! Estoy aquí para ayudarte. Si tienes otra pregunta, no dudes en escribirme."
    return "Gracias por tu mensaje. Un médico se comunicará contigo pronto."


def _get_user_id(request):
    return request.user.id if hasattr(request.user, "id") else None


def _get_user_tipo(request):
    return getattr(request.user, "tipo_usuario", "")


def _get_user_email(request):
    return getattr(request.user, "email", "")


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def mensaje_list(request):
    if request.method == "GET":
        user_id = _get_user_id(request)
        tipo = _get_user_tipo(request)
        qs = Mensaje.objects.all()
        if tipo == "paciente":
            qs = qs.filter(paciente_id=user_id)
        elif tipo == "medico":
            qs = qs.filter(medico_id__isnull=False)
        elif tipo != "admin":
            return Response({"error": "No tienes permisos"}, status=status.HTTP_403_FORBIDDEN)
        serializer = MensajeSerializer(qs, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        tipo = _get_user_tipo(request)
        if tipo != "paciente":
            return Response({"error": "Solo los pacientes pueden enviar mensajes"}, status=status.HTTP_403_FORBIDDEN)

        contenido = request.data.get("contenido", "").strip()
        if not contenido:
            return Response({"error": "El mensaje no puede estar vacío"}, status=status.HTTP_400_BAD_REQUEST)

        user_id = _get_user_id(request)
        email = _get_user_email(request)
        nombre = email.split("@")[0] if email else f"Paciente #{user_id}"

        mensaje = Mensaje.objects.create(
            paciente_id=user_id,
            paciente_nombre=nombre,
            contenido=contenido,
            enviado_por="paciente",
        )

        resp = auto_respuesta(contenido)
        respuesta = Mensaje.objects.create(
            paciente_id=user_id,
            paciente_nombre=nombre,
            contenido=resp,
            enviado_por="sistema",
        )

        return Response({
            "mensaje": MensajeSerializer(mensaje).data,
            "respuesta": MensajeSerializer(respuesta).data,
        }, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mensaje_detail(request, pk):
    try:
        msg = Mensaje.objects.get(pk=pk)
    except Mensaje.DoesNotExist:
        return Response({"error": "Mensaje no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    user_id = _get_user_id(request)
    tipo = _get_user_tipo(request)
    if tipo == "paciente" and msg.paciente_id != user_id:
        return Response({"error": "No tienes permisos"}, status=status.HTTP_403_FORBIDDEN)
    if tipo == "medico" and msg.medico_id and msg.medico_id != user_id:
        return Response({"error": "No tienes permisos"}, status=status.HTTP_403_FORBIDDEN)

    serializer = MensajeSerializer(msg)
    return Response(serializer.data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def marcar_leido(request, pk):
    try:
        msg = Mensaje.objects.get(pk=pk)
    except Mensaje.DoesNotExist:
        return Response({"error": "Mensaje no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    tipo = _get_user_tipo(request)
    if tipo not in ("medico", "admin"):
        return Response({"error": "Solo médicos o administradores"}, status=status.HTTP_403_FORBIDDEN)

    msg.leido = True
    msg.save()
    serializer = MensajeSerializer(msg)
    return Response(serializer.data)
