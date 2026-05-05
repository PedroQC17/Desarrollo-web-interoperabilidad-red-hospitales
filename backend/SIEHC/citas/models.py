from django.db import models


class Cita(models.Model):

    TIPO_CHOICES = [
        ('presencial', 'Presencial'),
        ('virtual', 'Virtual'),
    ]

    PRIORIDAD_CHOICES = [
        ('urgente', 'Urgente'),
        ('alta', 'Alta'),
        ('normal', 'Normal'),
        ('baja', 'Baja'),
    ]

    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('confirmada', 'Confirmada'),
        ('en_curso', 'En curso'),
        ('completada', 'Completada'),
        ('cancelada', 'Cancelada'),
    ]

    medico             = models.ForeignKey(
        'usuarios.Medico',
        on_delete=models.PROTECT,
        related_name='citas'
    )
    paciente           = models.ForeignKey(
        'usuarios.Paciente',
        on_delete=models.PROTECT,
        related_name='citas'
    )
    tipo               = models.CharField(max_length=15, choices=TIPO_CHOICES)
    categoria_servicio = models.CharField(max_length=100)
    especialidad       = models.CharField(max_length=150)
    prioridad          = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES, default='normal')
    estado             = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='pendiente')
    inicio             = models.DateTimeField()
    fin                = models.DateTimeField()
    fecha_solicitud    = models.DateTimeField(auto_now_add=True)
    fecha_cancelacion  = models.DateTimeField(null=True, blank=True)
    nota               = models.TextField(blank=True)
    costo_servicio     = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    creado_en          = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Cita'
        verbose_name_plural = 'Citas'
        ordering = ['-inicio']

    def __str__(self):
        return f'Cita #{self.id} - {self.paciente.nombre} con {self.medico.nombre}'

    def duracion_minutos(self):
        delta = self.fin - self.inicio
        return int(delta.total_seconds() / 60)