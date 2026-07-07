from django.db import models


class Hospital(models.Model):
    TIPO_CHOICES = [
        ("publico", "Público"),
        ("privado", "Privado"),
        ("clinica", "Clínica"),
        ("centro_salud", "Centro de Salud"),
    ]

    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default="publico")
    nombre = models.CharField(max_length=255)
    alias = models.CharField(max_length=100, blank=True)
    descripcion = models.TextField(blank=True)
    contacto = models.CharField(max_length=20)
    especialidad = models.CharField(max_length=255)
    ubicacion = models.CharField(max_length=255)
    periodo = models.CharField(max_length=100)
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    fecha_desactivacion = models.DateTimeField(null=True, blank=True)
    motivo_desactivacion = models.TextField(blank=True)

    class Meta:
        verbose_name = "Hospital"
        verbose_name_plural = "Hospitales"
        ordering = ["-creado_en"]

    def __str__(self):
        return self.nombre


class Medico(models.Model):
    ESPECIALIDADES = [
        ("Cardiologia", "Cardiología"),
        ("Pediatria", "Pediatría"),
        ("Ginecologia", "Ginecología"),
        ("Neurologia", "Neurología"),
        ("Traumatologia", "Traumatología"),
        ("Dermatologia", "Dermatología"),
        ("Medicina General", "Medicina General"),
        ("Psiquiatria", "Psiquiatría"),
        ("Oftalmologia", "Oftalmología"),
        ("Otorrinolaringologia", "Otorrinolaringología"),
    ]

    user_id = models.IntegerField(unique=True, verbose_name="ID en Auth Service")
    nombre = models.CharField(max_length=255)
    email = models.EmailField()
    telefono = models.CharField(max_length=20, blank=True)
    especialidad = models.CharField(max_length=50, choices=ESPECIALIDADES)
    ubicacion = models.CharField(max_length=100)
    servicio_sanitario = models.CharField(max_length=100)
    hospital_id = models.IntegerField(null=True, blank=True, verbose_name="ID del hospital")
    disponibilidad = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Médico"
        verbose_name_plural = "Médicos"

    def __str__(self):
        return f"{self.nombre} - {self.especialidad}"
