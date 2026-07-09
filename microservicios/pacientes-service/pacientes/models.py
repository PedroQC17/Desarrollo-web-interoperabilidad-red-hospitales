from django.db import models


class Paciente(models.Model):
    user_id = models.IntegerField(unique=True)

    fallecido = models.BooleanField(default=False)
    fecha_hora_fallecido = models.DateTimeField(null=True, blank=True)
    direccion = models.CharField(max_length=200)
    estado_civil = models.CharField(max_length=20)
    nac_multiple = models.IntegerField(default=1)
    foto = models.TextField(blank=True, default="")

    contacto_nombre = models.CharField(max_length=100)
    contacto_numero = models.CharField(max_length=20)
    contacto_dir = models.CharField(max_length=200)
    idioma_preferido = models.CharField(max_length=30)

    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Paciente"
        verbose_name_plural = "Pacientes"

    def __str__(self):
        return f"Paciente #{self.user_id}"

# creacion de la clase de historial
class Historial(models.Model):
    paciente = models.OneToOneField(Paciente, on_delete=models.CASCADE, related_name='historial')
    fecha_creacion = models.DateField(auto_now_add=True)
    activo = models.BooleanField(default=True)
    compartir_red = models.BooleanField(default=False)
    investigacion = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Historial médico'
        verbose_name_plural = 'Historiales médicos'

    def __str__(self):
        return f'Historial de {self.paciente.nombre}'

# creacion de la clase de observacion
class Observacion(models.Model):
    historial = models.ForeignKey(Historial, on_delete=models.CASCADE, related_name='observaciones')
    motivo_consulta = models.TextField()
    antecedentes_patologicos = models.TextField(blank=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Observación'
        ordering = ['-fecha']

    def __str__(self):
        return f'Observación #{self.id}'

# creacion de la clase examen
class Examen(models.Model):
    TIPO_CHOICES = [
        ('laboratorio', 'Laboratorio'),
        ('imagen', 'Imagen'),
        ('clinico', 'Clínico'),
        ('otro', 'Otro'),
    ]
    historial = models.ForeignKey(Historial, on_delete=models.CASCADE, related_name='examenes')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    duracion = models.IntegerField(help_text='Duración en minutos')
    descripcion = models.TextField()
    fecha = models.DateField()
    hora = models.TimeField()
    nota = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Examen'
        ordering = ['-fecha', '-hora']

    def __str__(self):
        return f'Examen {self.get_tipo_display()} - {self.fecha}'

#creacion de la clase receta
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
    historial = models.ForeignKey(Historial, on_delete=models.CASCADE, related_name='recetas')
    medicamento_id = models.IntegerField(help_text='ID del medicamento en medicamentos-service')
    intencion = models.TextField()
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES)
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES)
    instruccion_dosis = models.TextField()
    periodo_dosis = models.CharField(max_length=100, help_text='Ej: Cada 8 horas por 7 días')
    cantidad_suministrada = models.IntegerField()
    fecha_emitida = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Receta'
        verbose_name_plural = 'Recetas'
        ordering = ['-fecha_emitida']

    def __str__(self):
        return f'Receta #{self.id}'


# creacion de la creacion de diagnostico
class Diagnostico(models.Model):
    SEVERIDAD_CHOICES = [
        ('leve', 'Leve'),
        ('moderado', 'Moderado'),
        ('grave', 'Grave'),
        ('critico', 'Crítico'),
    ]
    historial = models.ForeignKey(Historial, on_delete=models.CASCADE, related_name='diagnosticos')
    estado_clinico = models.CharField(max_length=200)
    categoria = models.CharField(max_length=100)
    severidad = models.CharField(max_length=15, choices=SEVERIDAD_CHOICES)
    ubicacion_anatomica = models.CharField(max_length=150)
    fecha_hora_inicio = models.DateTimeField()
    edad_inicio = models.IntegerField()
    descripcion_inicio = models.TextField()
    fecha_hora_reduccion = models.DateTimeField(null=True, blank=True)
    edad_reduccion = models.IntegerField(null=True, blank=True)
    descripcion_reduccion = models.TextField(blank=True)
    nota = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Diagnóstico'
        verbose_name_plural = 'Diagnósticos'
        ordering = ['-fecha_hora_inicio']

    def __str__(self):
        return f'Diagnóstico #{self.id} - {self.estado_clinico}'
