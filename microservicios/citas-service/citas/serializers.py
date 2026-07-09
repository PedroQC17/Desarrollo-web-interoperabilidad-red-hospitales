from rest_framework import serializers
from .models import Cita, Hospital, Medico, Factura, Mensaje


class CitaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cita
        fields = "__all__"
        read_only_fields = ["creado_en"]


class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = "__all__"
        read_only_fields = ["creado_en"]


class MedicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medico
        fields = "__all__"
        read_only_fields = ["creado_en"]


class MedicoDisponibilidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medico
        fields = ["disponibilidad"]


class FacturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Factura
        fields = "__all__"
        read_only_fields = ["fecha_emision", "fecha_pago"]


class MensajeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mensaje
        fields = "__all__"
        read_only_fields = ["fecha_hora"]
