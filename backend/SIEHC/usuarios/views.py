from datetime import datetime

from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes

from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from .models import Usuario, Paciente, Medico, Administrador, NotificacionPreferencia
from citas.models import Cita
from medicamentos.models import Despacho
from facturacion.models import Facturacion
from hospitales.models import Hospital
from soporte.models import Mensaje
from .serializers import (
    PacienteSerializer,
    MedicoSerializer,
    AdministradorSerializer,
    UsuarioListSerializer,
    ProfileUpdateSerializer,
    ProfilePhotoSerializer,
    NotificacionPreferenciaSerializer
)
from .serializers import RegisterSerializer, LoginSerializer


from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated


from services.gestion_administrador.permisos import EsAdministrador

# views.py

class PacienteViewSet(viewsets.ModelViewSet):
    queryset = Paciente.objects.select_related('usuario').all()
    serializer_class = PacienteSerializer
    permission_classes=[EsAdministrador]


class MedicoViewSet(viewsets.ModelViewSet):
    queryset = Medico.objects.select_related('usuario', 'hospital').all()
    serializer_class = MedicoSerializer
    permission_classes=[EsAdministrador]



class AdministradorViewSet(viewsets.ModelViewSet):
    queryset = Administrador.objects.select_related('usuario').all()
    serializer_class = AdministradorSerializer
    permission_classes=[EsAdministrador]


@api_view(['PATCH'])
@permission_classes([EsAdministrador])
def toggle_activo(request, pk):
    try:
        usuario = Usuario.objects.get(pk=pk)
        usuario.is_active = request.data.get('is_active', usuario.is_active)
        usuario.save()
        return Response({'is_active': usuario.is_active})
    except Usuario.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

#clases de Vistas para Registro y Login


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {
            "id": user.id,
            "email": user.email,
            "nombre": user.nombre,
            "telecom": user.telecom,
            "genero": user.genero,
            "fec_nac": user.fec_nac,
            "tipo_usuario": user.tipo_usuario,
            "foto": request.build_absolute_uri(user.foto.url) if user.foto else None,
        }
        try:
            p = user.paciente
            data.update({
                "direccion": p.direccion,
                "estado_civil": p.estado_civil,
                "idioma_preferido": p.idioma_preferido,
            })
        except Paciente.DoesNotExist:
            pass
        try:
            m = user.medico
            data.update({
                "especialidad": m.especialidad,
                "hospital_id": m.hospital_id,
            })
        except Medico.DoesNotExist:
            pass
        return Response(data)

    def put(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfilePhotoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ProfilePhotoSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            foto_url = request.build_absolute_uri(request.user.foto.url) if request.user.foto else None
            return Response({"foto": foto_url})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        if request.user.foto:
            request.user.foto.delete(save=False)
            request.user.foto = None
            request.user.save()
        return Response({"foto": None})


class NotificacionPreferenciaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pref, _ = NotificacionPreferencia.objects.get_or_create(usuario=request.user)
        serializer = NotificacionPreferenciaSerializer(pref)
        return Response(serializer.data)

    def put(self, request):
        pref, _ = NotificacionPreferencia.objects.get_or_create(usuario=request.user)
        serializer = NotificacionPreferenciaSerializer(pref, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ActividadRecienteView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        actividades = []

        for c in Cita.objects.select_related('paciente__usuario', 'medico__usuario').order_by('-creado_en')[:5]:
            nombre = c.paciente.usuario.nombre if c.paciente else "—"
            actividades.append({
                "action": f"{nombre} solicitó una cita",
                "detail": f"{c.especialidad} - {dict(Cita.ESTADO_CHOICES).get(c.estado, c.estado)}",
                "time": c.creado_en.isoformat(),
                "type": "cita",
            })

        for d in Despacho.objects.select_related('cita__paciente__usuario').order_by('-fecha_despacho')[:5]:
            nombre = d.cita.paciente.usuario.nombre if d.cita and d.cita.paciente else "—"
            actividades.append({
                "action": f"Medicamentos despachados a {nombre}",
                "detail": f"Cita #{d.cita_id} - S/ {float(d.total):.2f}",
                "time": d.fecha_despacho.isoformat(),
                "type": "despacho",
            })

        for f in Facturacion.objects.select_related('cita__paciente__usuario').filter(estado_pago='pagado').order_by('-fecha_emitida')[:5]:
            nombre = f.cita.paciente.usuario.nombre if f.cita and f.cita.paciente else "—"
            actividades.append({
                "action": f"Pago registrado de {nombre}",
                "detail": f"S/ {float(f.monto_total):.2f} - {f.descripcion[:60]}",
                "time": f.fecha_emitida.isoformat(),
                "type": "pago",
            })

        for h in Hospital.objects.order_by('-creado_en')[:5]:
            accion = "afiliado a la red" if h.activo else "desafiliado de la red"
            actividades.append({
                "action": f"Hospital {h.nombre} {accion}",
                "detail": h.ubicacion,
                "time": h.creado_en.isoformat(),
                "type": "hospital",
            })

        for m in Mensaje.objects.select_related('paciente__usuario').order_by('-fecha_hora')[:5]:
            nombre = m.paciente.usuario.nombre if m.paciente else "—"
            actividades.append({
                "action": f"{nombre} envió un mensaje",
                "detail": m.contenido[:80],
                "time": m.fecha_hora.isoformat(),
                "type": "mensaje",
            })

        actividades.sort(key=lambda a: a["time"], reverse=True)
        return Response(actividades[:10])


#  REGISTER
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            refresh = RefreshToken.for_user(user)

            return Response({
                'user_id': user.id,
                'email': user.email,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# LOGIN
class LoginView(APIView):

    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data['user']

            refresh = RefreshToken.for_user(user)

            return Response({
                'user_id': user.id,
                'email': user.email,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class UsuarioListView(APIView):
    """
    GET /api/usuarios/admin/usuarios/
    Lista todos los usuarios (pacientes, médicos, admins) en una sola llamada.
    Solo accesible por ADMIN.
    """
    permission_classes = [EsAdministrador]

    def get(self, request):
        usuarios = Usuario.objects.all()
        serializer = UsuarioListSerializer(usuarios, many=True)
        return Response(serializer.data)