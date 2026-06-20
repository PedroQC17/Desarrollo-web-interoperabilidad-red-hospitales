from rest_framework import serializers
from facturacion.models import Facturacion


class FacturacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Facturacion
        fields = '__all__'

    def validate(self, data):
        cita = data.get('cita')
        receta = data.get('receta')

        # 🔴 Debe existir al menos uno
        if not cita and not receta:
            raise serializers.ValidationError(
                "Debe asociarse a una cita o a una receta"
            )

        # 🔴 Evitar doble facturación de la misma cita
        if cita:
            if Facturacion.objects.filter(cita=cita).exists():
                raise serializers.ValidationError(
                    "Esta cita ya tiene una factura"
                )

        return data