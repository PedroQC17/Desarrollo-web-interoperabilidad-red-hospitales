from django.db import models


class Medicamento(models.Model):
    TIPO_CHOICES = [
        ("analgesico", "Analgésico"),
        ("antibiotico", "Antibiótico"),
        ("antiinflamatorio", "Antiinflamatorio"),
        ("antiviral", "Antiviral"),
        ("vitamina", "Vitamina"),
        ("otro", "Otro"),
    ]

    hospital_id = models.IntegerField(verbose_name="ID del hospital")
    nombre = models.CharField(max_length=200)
    funcion = models.TextField()
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES)
    stock = models.IntegerField(default=0)
    descripcion = models.TextField(blank=True)
    costo = models.DecimalField(max_digits=10, decimal_places=2)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Medicamento"
        verbose_name_plural = "Medicamentos"
        ordering = ["nombre"]

    def __str__(self):
        return f"{self.nombre} (stock: {self.stock})"

    def hay_stock(self, cantidad=1):
        return self.stock >= cantidad


class Despacho(models.Model):
    medico_id = models.IntegerField(verbose_name="ID del médico")
    medico_nombre = models.CharField(max_length=255, blank=True)
    paciente_id = models.IntegerField(default=0, verbose_name="ID del paciente")
    paciente_nombre = models.CharField(max_length=255, blank=True)
    cita_id = models.IntegerField(unique=True, verbose_name="ID de la cita")
    fecha_despacho = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        verbose_name = "Despacho"
        verbose_name_plural = "Despachos"
        ordering = ["-fecha_despacho"]

    def __str__(self):
        return f"Despacho #{self.id} - Cita {self.cita_id}"

    def calcular_total(self):
        total = sum(item.subtotal for item in self.items.all())
        self.total = total
        self.save(update_fields=["total"])
        return total


class DespachoItem(models.Model):
    despacho = models.ForeignKey(Despacho, on_delete=models.CASCADE, related_name="items")
    medicamento_id = models.IntegerField(verbose_name="ID del medicamento")
    medicamento_nombre = models.CharField(max_length=200, blank=True)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, editable=False)

    class Meta:
        verbose_name = "Ítem de Despacho"
        verbose_name_plural = "Ítems de Despacho"

    def save(self, *args, **kwargs):
        self.subtotal = self.cantidad * self.precio_unitario
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.medicamento_nombre} x{self.cantidad} (Despacho #{self.despacho.id})"
