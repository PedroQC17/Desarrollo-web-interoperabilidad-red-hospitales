from django.http import JsonResponse
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken

from .models import Usuario
from .serializers import RegisterSerializer, UsuarioSerializer


def health(request):
    return JsonResponse({"status": "ok", "service": "auth-service"})


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UsuarioSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        user = authenticate(request, email=email, password=password)
        if user is None:
            return Response({"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)
        if not user.is_active:
            return Response({"error": "Usuario desactivado"}, status=status.HTTP_403_FORBIDDEN)
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UsuarioSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            }
        )


class RefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"error": "Refresh token requerido"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            refresh = RefreshToken(refresh_token)
            return Response({"access": str(refresh.access_token)})
        except Exception:
            return Response({"error": "Refresh token inválido"}, status=status.HTTP_401_UNAUTHORIZED)


class VerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response({"error": "Token requerido"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            access = AccessToken(token)
            user = Usuario.objects.get(id=access["user_id"])
            return Response({
                "user_id": user.id,
                "tipo": user.tipo_usuario,
                "nombre": user.nombre,
            })
        except Exception:
            return Response({"error": "Token inválido o expirado"}, status=status.HTTP_401_UNAUTHORIZED)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UsuarioSerializer(request.user).data)


class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            user = Usuario.objects.get(pk=pk)
            return Response(UsuarioSerializer(user).data)
        except Usuario.DoesNotExist:
            return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)


class UserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = Usuario.objects.all().order_by("-fecha_registro")
        return Response(UsuarioSerializer(users, many=True).data)
