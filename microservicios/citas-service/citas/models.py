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
    hospital = models.ForeignKey(Hospital, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Hospital")
    disponibilidad = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Médico"
        verbose_name_plural = "Médicos"

    def __str__(self):
        return f"{self.nombre} - {self.especialidad}"


class Cita(models.Model):
    ESTADOS = [
        ("pendiente", "Pendiente"),
        ("confirmada", "Confirmada"),
        ("en_curso", "En curso"),
        ("completada", "Completada"),
        ("cancelada", "Cancelada"),
    ]
    PRIORIDADES = [
        ("baja", "Baja"),
        ("media", "Media"),
        ("alta", "Alta"),
    ]

    paciente_id = models.IntegerField()
    paciente_nombre = models.CharField(max_length=255, blank=True)
    medico = models.ForeignKey(Medico, on_delete=models.PROTECT, related_name="citas")
    medico_nombre = models.CharField(max_length=255, blank=True)
    especialidad = models.CharField(max_length=100, blank=True)
    tipo = models.CharField(max_length=50, blank=True)
    inicio = models.DateTimeField()
    fin = models.DateTimeField()
    estado = models.CharField(max_length=20, choices=ESTADOS, default="pendiente")
    prioridad = models.CharField(max_length=10, choices=PRIORIDADES, default="media")
    motivo = models.TextField(blank=True)
    nota = models.TextField(blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Cita"
        verbose_name_plural = "Citas"
        ordering = ["-inicio"]

    def __str__(self):
        return f"Cita #{self.pk} - {self.paciente_nombre} con {self.medico_nombre}"


class Factura(models.Model):
    METODO_PAGO = [
        ("efectivo", "Efectivo"),
        ("tarjeta", "Tarjeta"),
        ("transferencia", "Transferencia"),
    ]

    paciente_id = models.IntegerField()
    paciente_nombre = models.CharField(max_length=255, blank=True)
    cita = models.OneToOneField(Cita, on_delete=models.PROTECT, null=True, blank=True, related_name="factura")
    receta_id = models.IntegerField(null=True, blank=True)
    monto_consulta = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    monto_medicamentos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    monto_total = models.DecimalField(max_digits=10, decimal_places=2)
    descripcion = models.TextField(blank=True)
    pagada = models.BooleanField(default=False)
    metodo_pago = models.CharField(max_length=20, choices=METODO_PAGO, blank=True)
    fecha_emision = models.DateTimeField(auto_now_add=True)
    fecha_pago = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Factura"
        verbose_name_plural = "Facturas"
        ordering = ["-fecha_emision"]

    def __str__(self):
        return f"Factura #{self.id} - {self.paciente_nombre}"


class Mensaje(models.Model):
    ENVIADO_POR = [
        ("paciente", "Paciente"),
        ("medico", "Médico"),
        ("sistema", "Sistema"),
    ]

    paciente_id = models.IntegerField()
    paciente_nombre = models.CharField(max_length=255, blank=True)
    medico = models.ForeignKey(Medico, on_delete=models.SET_NULL, null=True, blank=True, related_name="mensajes")
    contenido = models.TextField()
    enviado_por = models.CharField(max_length=10, choices=ENVIADO_POR)
    fecha_hora = models.DateTimeField(auto_now_add=True)
    leido = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Mensaje"
        verbose_name_plural = "Mensajes"
        ordering = ["fecha_hora"]

    def __str__(self):
        return f"Mensaje #{self.id} de {self.paciente_nombre}"
