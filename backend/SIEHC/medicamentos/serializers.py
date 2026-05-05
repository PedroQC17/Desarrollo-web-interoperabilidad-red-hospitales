from rest_framework import serializers
from .models import Medicamento


class MedicamentoSerializer(serializers.ModelSerializer):
    hospital_nombre = serializers.CharField(source='hospital.nombre', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = Medicamento
        fields = '__all__'