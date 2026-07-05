from django.db import models


class Factura(models.Model):
    METODO_PAGO = [
        ("efectivo", "Efectivo"),
        ("tarjeta", "Tarjeta"),
        ("transferencia", "Transferencia"),
    ]

    paciente_id = models.IntegerField()
    paciente_nombre = models.CharField(max_length=255, blank=True)
    cita_id = models.IntegerField(unique=True, null=True, blank=True)
    despacho_id = models.IntegerField(null=True, blank=True)
    monto_consulta = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    monto_medicamentos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    monto_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fecha_emision = models.DateTimeField(auto_now_add=True)
    pagada = models.BooleanField(default=False)
    metodo_pago = models.CharField(max_length=20, choices=METODO_PAGO, blank=True)
    fecha_pago = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Factura"
        verbose_name_plural = "Facturas"
        ordering = ["-fecha_emision"]

    def __str__(self):
        return f"Factura #{self.pk} - {self.paciente_nombre}"
