from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


# =========================
# 🔹 MANAGER
# =========================
class UsuarioManager(BaseUserManager):

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("El email es obligatorio")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        return self.create_user(email, password, **extra_fields)


# =========================
# 🔹 USUARIO BASE
# =========================
class Usuario(AbstractBaseUser, PermissionsMixin):

    TIPO_USUARIO = (
        ('paciente', 'Paciente'),
        ('medico', 'Médico'),
        ('admin', 'Administrador'),
    )

    email = models.EmailField(unique=True)
    nombre = models.CharField(max_length=100)
    telecom = models.CharField(max_length=20)
    genero = models.CharField(max_length=10)
    fec_nac = models.DateField()

    tipo_usuario = models.CharField(max_length=20, choices=TIPO_USUARIO)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UsuarioManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombre']

    def __str__(self):
        return f"{self.email} ({self.tipo_usuario})"


# =========================
# 🔹 PACIENTE
# =========================
class Paciente(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='paciente')

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

    def __str__(self):
        return self.usuario.nombre


# =========================
# 🔹 MEDICO
# =========================
class Medico(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='medico')

    hospital = models.ForeignKey('hospitales.Hospital', on_delete=models.SET_NULL, null=True)
    periodo = models.CharField(max_length=50)
    especialidad = models.CharField(max_length=100)
    ubicacion = models.CharField(max_length=100)
    servicio_sanitario = models.CharField(max_length=100)
    disponibilidad = models.BooleanField(default=True)

    def __str__(self):
        return self.usuario.nombre


# =========================
# 🔹 ADMINISTRADOR
# =========================
class Administrador(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='administrador')

    tiempo_servicio_inicio = models.DateTimeField(null=True, blank=True)
    tiempo_servicio_fin = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.usuario.nombre