from django.db import models


class Facturacion(models.Model):

    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('pagado', 'Pagado'),
        ('anulado', 'Anulado'),
    ]

    cita          = models.OneToOneField(
        'citas.Cita',
        on_delete=models.PROTECT,
        related_name='factura',
        null=True, blank=True
    )
    receta        = models.ForeignKey(
        'historial.Receta',
        on_delete=models.PROTECT,
        related_name='facturas',
        null=True, blank=True
    )
    descripcion   = models.TextField()
    monto_total   = models.DecimalField(max_digits=10, decimal_places=2)
    estado_pago   = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='pendiente')
    fecha_emitida = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Facturación'
        verbose_name_plural = 'Facturaciones'
        ordering = ['-fecha_emitida']

    def __str__(self):
        return f'Factura #{self.id} - S/. {self.monto_total} ({self.get_estado_pago_display()})'# Create your models here.
