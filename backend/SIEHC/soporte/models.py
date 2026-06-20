from django.db import models


class Mensaje(models.Model):

    paciente   = models.ForeignKey(
        'usuarios.Paciente',
        on_delete=models.CASCADE,
        related_name='mensajes'
    )
    medico     = models.ForeignKey(
        'usuarios.Medico',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='mensajes'
    )
    contenido  = models.TextField()
    fecha_hora = models.DateTimeField(auto_now_add=True)
    leido      = models.BooleanField(default=False)
    enviado_por = models.CharField(
        max_length=10,
        choices=[('paciente', 'Paciente'), ('medico', 'Médico'), ('sistema', 'Sistema')],
        default='paciente'
    )

    class Meta:
        verbose_name = 'Mensaje'
        verbose_name_plural = 'Mensajes'
        ordering = ['fecha_hora']

    def __str__(self):
        return f'Mensaje #{self.id} - {self.enviado_por} ({self.fecha_hora:%d/%m/%Y %H:%M})'