from django.db import models
from django.contrib.auth.models import AbstractBaseUser

from django.contrib.auth.models import BaseUserManager

class UsuarioManager(BaseUserManager):
    def create_user(self, email, password=None):
        if not email:
            raise ValueError("El email es obligatorio")

        user = self.model(email=self.normalize_email(email))
        user.set_password(password)
        user.save()
        return user
    

# 🔹 Modelo base
class Usuario(AbstractBaseUser):
    email = models.EmailField(unique=True)
    nombre = models.CharField(max_length=100)
    telecom = models.CharField(max_length=20)
    genero = models.CharField(max_length=10)
    fec_nac = models.DateField()

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UsuarioManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombre']

    def __str__(self):
        return self.email
    
class Paciente(Usuario):
    fallecido = models.BooleanField(default=False)
    fecha_hora_fallecido = models.DateTimeField(null=True, blank=True)
    direccion = models.CharField(max_length=200)
    estado_civil = models.CharField(max_length=20)
    nac_multiple = models.IntegerField(default=1)
    foto = models.ImageField(null=True, blank=True)
    contacto_nombre = models.CharField(max_length=100)
    contacto_numero = models.CharField(max_length=20)
    contacto_dir = models.CharField(max_length=200)
    idioma_preferido = models.CharField(max_length=30)


class Medico(Usuario):
    hospital = models.ForeignKey('hospitales.Hospital', on_delete=models.SET_NULL, null=True)
    periodo = models.CharField(max_length=50)
    especialidad = models.CharField(max_length=100)
    ubicacion = models.CharField(max_length=100)
    servicio_sanitario = models.CharField(max_length=100)
    disponibilidad = models.BooleanField(default=True)


class Administrador(Usuario):
    tiempo_servicio_inicio = models.DateTimeField(null=True, blank=True)
    tiempo_servicio_fin = models.DateTimeField(null=True, blank=True)