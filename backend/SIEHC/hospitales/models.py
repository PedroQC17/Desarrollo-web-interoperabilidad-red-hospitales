from django.db import models


class Hospital(models.Model):

    TIPO_CHOICES = [
        ('publico', 'Público'),
        ('privado', 'Privado'),
        ('clinica', 'Clínica'),
        ('centro_salud', 'Centro de Salud'),
    ]

    tipo        = models.CharField(max_length=20, choices=TIPO_CHOICES)
    nombre      = models.CharField(max_length=200)
    alias       = models.CharField(max_length=100, blank=True)
    descripcion = models.TextField(blank=True)
    contacto    = models.CharField(max_length=50)
    especialidad = models.CharField(max_length=200)
    ubicacion   = models.CharField(max_length=300)
    periodo     = models.CharField(max_length=100, help_text='Ej: Lun-Vie 8am-6pm')
    activo      = models.BooleanField(default=True)
    creado_en   = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Hospital'
        verbose_name_plural = 'Hospitales'
        ordering = ['nombre']

    def __str__(self):
        return f'{self.nombre} ({self.get_tipo_display()})'