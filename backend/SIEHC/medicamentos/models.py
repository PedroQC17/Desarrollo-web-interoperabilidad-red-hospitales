from django.db import models
from django.utils import timezone


class Medicamento(models.Model):

    TIPO_CHOICES = [
        ('analgesico', 'Analgésico'),
        ('antibiotico', 'Antibiótico'),
        ('antiinflamatorio', 'Antiinflamatorio'),
        ('antiviral', 'Antiviral'),
        ('vitamina', 'Vitamina'),
        ('otro', 'Otro'),
    ]

    hospital    = models.ForeignKey(
        'hospitales.Hospital',
        on_delete=models.CASCADE,
        related_name='medicamentos'
    )
    nombre      = models.CharField(max_length=200)
    funcion     = models.TextField()
    tipo        = models.CharField(max_length=30, choices=TIPO_CHOICES)
    stock       = models.IntegerField(default=0)
    descripcion = models.TextField(blank=True)
    costo       = models.DecimalField(max_digits=10, decimal_places=2)
    activo      = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Medicamento'
        verbose_name_plural = 'Medicamentos'
        ordering = ['nombre']

    def __str__(self):
        return f'{self.nombre} (stock: {self.stock})'

    def hay_stock(self, cantidad=1):
        return self.stock >= cantidad


class Despacho(models.Model):
    """
    Registro del despacho de medicamentos realizado por un médico para una cita.
    """
    medico          = models.ForeignKey(
        'usuarios.Medico',
        on_delete=models.CASCADE,
        related_name='despachos'
    )
    cita            = models.OneToOneField(
        'citas.Cita',
        on_delete=models.CASCADE,
        related_name='despacho'
    )
    fecha_despacho  = models.DateTimeField(auto_now_add=True)
    total           = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text='Total del despacho basado en el costo de los medicamentos'
    )

    class Meta:
        verbose_name = 'Despacho'
        verbose_name_plural = 'Despachos'
        ordering = ['-fecha_despacho']

    def __str__(self):
        return f'Despacho #{self.id} - Cita {self.cita.id} ({self.fecha_despacho.strftime("%d/%m/%Y")})'

    def calcular_total(self):
        """Calcula el total del despacho basado en los ítems."""
        total = sum(item.subtotal for item in self.items.all())
        self.total = total
        self.save(update_fields=['total'])
        return total


class DespachoItem(models.Model):
    """
    Ítem individual de un despacho (medicamento + cantidad).
    """
    despacho        = models.ForeignKey(
        Despacho,
        on_delete=models.CASCADE,
        related_name='items'
    )
    medicamento     = models.ForeignKey(
        Medicamento,
        on_delete=models.PROTECT
    )
    cantidad        = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal        = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        editable=False
    )

    class Meta:
        verbose_name = 'Ítem de Despacho'
        verbose_name_plural = 'Ítems de Despacho'

    def save(self, *args, **kwargs):
        """Calcula el subtotal antes de guardar."""
        self.subtotal = self.cantidad * self.precio_unitario
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.medicamento.nombre} x{self.cantidad} (Despacho #{self.despacho.id})'