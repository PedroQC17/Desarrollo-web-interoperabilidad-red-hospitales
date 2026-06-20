

from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password


from usuarios.models import Usuario, Paciente, Medico, Administrador

def register_usuario(email, password, **extra_fields):
    if not email:
        raise ValueError("El email es obligatorio")

    if not password:
        raise ValueError("La contraseña es obligatoria")

    if Usuario.objects.filter(email=email).exists():
        raise ValueError("El usuario ya existe")

    tipo = extra_fields.get('tipo_usuario')

    user = Usuario.objects.create_user(
        email=email,
        password=password,
        **extra_fields
    )

    # 🔥 Crear perfil automáticamente
    if tipo == 'paciente':
        Paciente.objects.create(usuario=user)

    elif tipo == 'medico':
        Medico.objects.create(usuario=user)

    elif tipo == 'admin':
        Administrador.objects.create(usuario=user)

    return user


def login_usuario(email, password):
    # ⚠️ Django usa "username" internamente
    user = authenticate(username=email, password=password)

    if user is None:
        return None

    if not user.is_active:
        raise ValueError("Usuario inactivo")

    return user