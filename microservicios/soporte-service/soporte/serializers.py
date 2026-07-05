from rest_framework import serializers
from .models import Mensaje


class MensajeSerializer(serializers.ModelSerializer):
    enviado_por_display = serializers.CharField(source="get_enviado_por_display", read_only=True)

    class Meta:
        model = Mensaje
        fields = "__all__"
        read_only_fields = ["fecha_hora", "leido"]
