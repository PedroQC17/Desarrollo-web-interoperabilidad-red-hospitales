from django.db import models


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