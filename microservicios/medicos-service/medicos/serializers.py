from rest_framework import serializers
from .models import Medico


class MedicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medico
        fields = "__all__"
        read_only_fields = ["creado_en"]


class MedicoDisponibilidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medico
        fields = ["disponibilidad"]
