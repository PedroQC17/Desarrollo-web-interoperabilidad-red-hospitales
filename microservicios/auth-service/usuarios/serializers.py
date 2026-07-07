from rest_framework import serializers
from .models import Usuario


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Usuario
        fields = ["email", "nombre", "tipo_usuario", "password"]

    def create(self, validated_data):
        return Usuario.objects.create_user(**validated_data)


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ["id", "email", "nombre", "tipo_usuario", "is_active", "fecha_registro", "foto", "notificaciones", "telecom", "genero", "fec_nac"]
        read_only_fields = ["fecha_registro"]


class NotificacionesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ["notificaciones"]
