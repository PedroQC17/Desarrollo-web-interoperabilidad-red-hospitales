from django.db import models


class Mensaje(models.Model):
    ENVIADO_POR_CHOICES = [
        ("paciente", "Paciente"),
        ("medico", "Médico"),
        ("sistema", "Sistema"),
    ]

    paciente_id = models.IntegerField(verbose_name="ID del paciente en Auth Service")
    paciente_nombre = models.CharField(max_length=255)
    medico_id = models.IntegerField(null=True, blank=True, verbose_name="ID del médico en Médicos Service")
    medico_nombre = models.CharField(max_length=255, blank=True)
    contenido = models.TextField()
    fecha_hora = models.DateTimeField(auto_now_add=True)
    leido = models.BooleanField(default=False)
    enviado_por = models.CharField(max_length=10, choices=ENVIADO_POR_CHOICES, default="paciente")

    class Meta:
        verbose_name = "Mensaje"
        verbose_name_plural = "Mensajes"
        ordering = ["-fecha_hora"]

    def __str__(self):
        return f"Mensaje #{self.id} - {self.enviado_por} ({self.fecha_hora:%d/%m/%Y %H:%M})"
