

from usuarios.models import Usuario
from django.contrib.auth import authenticate

def register_usuario(email, password):
    if Usuario.objects.filter(email=email).exists():
        return False

    Usuario.objects.create_user(email=email, password=password)
    return True


def login_usuario(email, password):
    user = authenticate(email=email, password=password)

    if user:
        return True
    return False