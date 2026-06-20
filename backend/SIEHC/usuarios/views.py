from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes

from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from .models import Usuario, Paciente, Medico, Administrador
from .serializers import (
    PacienteSerializer,
    MedicoSerializer,
    AdministradorSerializer,
    UsuarioListSerializer
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
        return Response({
            "email": user.email,
            "nombre": user.nombre,
            "tipo_usuario": user.tipo_usuario
        })

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