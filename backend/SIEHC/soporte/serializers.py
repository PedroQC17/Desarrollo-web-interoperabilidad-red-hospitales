from rest_framework import serializers
from .models import Mensaje


class MensajeSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.CharField(source='paciente.nombre', read_only=True)
    medico_nombre = serializers.CharField(source='medico.nombre', read_only=True)
    enviado_por_display = serializers.CharField(source='get_enviado_por_display', read_only=True)

    class Meta:
        model = Mensaje
        fields = '__all__'