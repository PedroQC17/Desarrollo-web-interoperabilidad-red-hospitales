from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from .models import Paciente, Medico, Administrador
from .serializers import (
    PacienteSerializer,
    MedicoSerializer,
    AdministradorSerializer
)
from .serializers import RegisterSerializer, LoginSerializer


from rest_framework_simplejwt.tokens import RefreshToken

from rest_framework.permissions import AllowAny


from rest_framework.permissions import IsAuthenticated



class PacienteViewSet(viewsets.ModelViewSet):
    queryset = Paciente.objects.select_related('usuario').all()
    serializer_class = PacienteSerializer


class MedicoViewSet(viewsets.ModelViewSet):
    queryset = Medico.objects.select_related('usuario', 'hospital').all()
    serializer_class = MedicoSerializer


class AdministradorViewSet(viewsets.ModelViewSet):
    queryset = Administrador.objects.select_related('usuario').all()
    serializer_class = AdministradorSerializer


#clases de Vistas para Registro y Login

# views.py

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "email": user.email,
            "nombre": user.nombre,
            "tipo_usuario": user.tipo_usuario
        })

# 🔹 REGISTER
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


# 🔹 LOGIN
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