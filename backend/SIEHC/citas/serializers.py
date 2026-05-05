from rest_framework import serializers
from citas.models import Cita


class CitaSerializer(serializers.ModelSerializer):
    duracion_minutos = serializers.SerializerMethodField()

    class Meta:
        model = Cita
        fields = '__all__'

    def get_duracion_minutos(self, obj):
        return obj.duracion_minutos()

    def validate(self, data):
        inicio = data.get('inicio')
        fin = data.get('fin')

        if inicio and fin and fin <= inicio:
            raise serializers.ValidationError("La fecha de fin debe ser mayor que la de inicio")

        return data