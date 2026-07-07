from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UsuarioManager(BaseUserManager):
    def create_user(self, email, nombre, tipo_usuario, password=None):
        if not email:
            raise ValueError("El email es obligatorio")
        user = self.model(
            email=self.normalize_email(email),
            nombre=nombre,
            tipo_usuario=tipo_usuario,
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, nombre, password=None, **extra_fields):
        extra_fields.setdefault("tipo_usuario", "admin")
        user = self.create_user(email, nombre, extra_fields.pop("tipo_usuario"), password)
        user.is_staff = True
        user.is_superuser = True
        for key, value in extra_fields.items():
            setattr(user, key, value)
        user.save(using=self._db)
        return user


class Usuario(AbstractBaseUser, PermissionsMixin):
    TIPO_CHOICES = [
        ("paciente", "Paciente"),
        ("medico", "Médico"),
        ("admin", "Administrador"),
    ]

    email = models.EmailField(unique=True, max_length=255)
    nombre = models.CharField(max_length=255)
    tipo_usuario = models.CharField(max_length=10, choices=TIPO_CHOICES)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    foto = models.TextField(blank=True, default="")
    notificaciones = models.JSONField(default=dict, blank=True)

    objects = UsuarioManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nombre", "tipo_usuario"]

    def __str__(self):
        return f"{self.nombre} ({self.email})"
