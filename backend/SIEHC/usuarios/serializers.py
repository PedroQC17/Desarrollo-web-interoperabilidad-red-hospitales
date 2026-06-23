from rest_framework import serializers
from .models import Usuario, Paciente, Medico, Administrador
from django.contrib.auth import authenticate

from services.gestion_usuarios.registro_usuarios import login_usuario,register_usuario

class UsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = '__all__'

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = Usuario(**validated_data)
        user.set_password(password)
        user.save()
        return user


# CLASES DE REGISTRO Y LOGIN
class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirmar = serializers.CharField(write_only=True, required=False)
    nombre = serializers.CharField()
    telecom = serializers.CharField()
    genero = serializers.CharField()
    fec_nac = serializers.DateField()
    tipo_usuario = serializers.CharField()

    def validate(self, data):
        if data.get('confirmar') and data.get('password') != data.get('confirmar'):
            raise serializers.ValidationError({"confirmar": "Las contraseñas no coinciden"})
        return data

    def create(self, validated_data):
        validated_data.pop('confirmar', None)
        return register_usuario(**validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['email'], password=data['password'])

        if not user:
            raise serializers.ValidationError("Credenciales inválidas")

        if not user.is_active:
            raise serializers.ValidationError("Usuario inactivo")

        data['user'] = user
        return data



# Paciente
class PacienteSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer()

    class Meta:
        model = Paciente
        fields = '__all__'

    def create(self, validated_data):
        usuario_data = validated_data.pop('usuario')
        usuario_data['tipo_usuario'] = 'paciente'

        usuario = Usuario.objects.create_user(**usuario_data)
        paciente = Paciente.objects.create(usuario=usuario, **validated_data)

        return paciente



#  Medico
class MedicoSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer()

    class Meta:
        model = Medico
        fields = '__all__'

    def create(self, validated_data):
        usuario_data = validated_data.pop('usuario')
        usuario_data['tipo_usuario'] = 'medico'

        usuario = Usuario.objects.create_user(**usuario_data)
        medico = Medico.objects.create(usuario=usuario, **validated_data)

        return medico


#  Admin
class AdministradorSerializer(serializers.ModelSerializer):

    usuario = UsuarioSerializer()

    class Meta:
        model = Administrador
        fields = '__all__'

    def create(self, validated_data):
        usuario_data = validated_data.pop('usuario')
        usuario_data['tipo_usuario'] = 'admin'

        usuario = Usuario.objects.create_user(**usuario_data)
        admin = Administrador.objects.create(usuario=usuario, **validated_data)

        return admin
    


class UsuarioListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'email', 'nombre', 'telecom', 'genero', 'fec_nac', 'tipo_usuario', 'is_active']

