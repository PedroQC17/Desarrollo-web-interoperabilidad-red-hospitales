from django.db import models


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
    medico_id = models.IntegerField()
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
