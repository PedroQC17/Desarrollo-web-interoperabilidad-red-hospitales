from django.db import models


class Historial(models.Model):

    paciente      = models.OneToOneField(
        'usuarios.Paciente',
        on_delete=models.CASCADE,
        related_name='historial'
    )
    fecha_creacion = models.DateField(auto_now_add=True)
    activo         = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Historial médico'
        verbose_name_plural = 'Historiales médicos'

    def __str__(self):
        return f'Historial de {self.paciente.nombre}'


class Observacion(models.Model):

    historial               = models.ForeignKey(
        Historial,
        on_delete=models.CASCADE,
        related_name='observaciones'
    )
    motivo_consulta          = models.TextField()
    antecedentes_patologicos = models.TextField(blank=True)
    fecha                    = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Observación'
        verbose_name_plural = 'Observaciones'
        ordering = ['-fecha']

    def __str__(self):
        return f'Observación #{self.id} - {self.historial}'


class Examen(models.Model):

    TIPO_CHOICES = [
        ('laboratorio', 'Laboratorio'),
        ('imagen', 'Imagen'),
        ('clinico', 'Clínico'),
        ('otro', 'Otro'),
    ]

    historial   = models.ForeignKey(
        Historial,
        on_delete=models.CASCADE,
        related_name='examenes'
    )
    tipo        = models.CharField(max_length=20, choices=TIPO_CHOICES)
    duracion    = models.IntegerField(help_text='Duración en minutos')
    descripcion = models.TextField()
    fecha       = models.DateField()
    hora        = models.TimeField()
    nota        = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Examen'
        verbose_name_plural = 'Exámenes'
        ordering = ['-fecha', '-hora']

    def __str__(self):
        return f'Examen {self.get_tipo_display()} - {self.fecha}'


class Receta(models.Model):

    CATEGORIA_CHOICES = [
        ('controlado', 'Controlado'),
        ('libre', 'Libre venta'),
        ('retenida', 'Retenida'),
    ]

    PRIORIDAD_CHOICES = [
        ('alta', 'Alta'),
        ('media', 'Media'),
        ('baja', 'Baja'),
    ]

    historial             = models.ForeignKey(
        Historial,
        on_delete=models.CASCADE,
        related_name='recetas'
    )
    medicamento           = models.ForeignKey(
        'medicamentos.Medicamento',
        on_delete=models.PROTECT,
        related_name='recetas'
    )
    intencion             = models.TextField()
    categoria             = models.CharField(max_length=20, choices=CATEGORIA_CHOICES)
    prioridad             = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES)
    instruccion_dosis     = models.TextField()
    periodo_dosis         = models.CharField(max_length=100, help_text='Ej: Cada 8 horas por 7 días')
    cantidad_suministrada = models.IntegerField()
    fecha_emitida         = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Receta'
        verbose_name_plural = 'Recetas'
        ordering = ['-fecha_emitida']

    def __str__(self):
        return f'Receta #{self.id} - {self.medicamento.nombre}'


class Diagnostico(models.Model):

    SEVERIDAD_CHOICES = [
        ('leve', 'Leve'),
        ('moderado', 'Moderado'),
        ('grave', 'Grave'),
        ('critico', 'Crítico'),
    ]

    historial              = models.ForeignKey(
        Historial,
        on_delete=models.CASCADE,
        related_name='diagnosticos'
    )
    estado_clinico         = models.CharField(max_length=200)
    categoria              = models.CharField(max_length=100)
    severidad              = models.CharField(max_length=15, choices=SEVERIDAD_CHOICES)
    ubicacion_anatomica    = models.CharField(max_length=150)
    fecha_hora_inicio      = models.DateTimeField()
    edad_inicio            = models.IntegerField()
    descripcion_inicio     = models.TextField()
    fecha_hora_reduccion   = models.DateTimeField(null=True, blank=True)
    edad_reduccion         = models.IntegerField(null=True, blank=True)
    descripcion_reduccion  = models.TextField(blank=True)
    nota                   = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Diagnóstico'
        verbose_name_plural = 'Diagnósticos'
        ordering = ['-fecha_hora_inicio']

    def __str__(self):
        return f'Diagnóstico #{self.id} - {self.estado_clinico} ({self.get_severidad_display()})'# Create your models here.
