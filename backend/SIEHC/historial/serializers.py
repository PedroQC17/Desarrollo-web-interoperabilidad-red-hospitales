from rest_framework import serializers
from historial.models import (
    Historial, Observacion, Examen, Receta, Diagnostico
)


# 🔹 Historial
class HistorialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Historial
        fields = '__all__'


# 🔹 Observacion
class ObservacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Observacion
        fields = '__all__'


# 🔹 Examen
class ExamenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Examen
        fields = '__all__'


# 🔹 Receta
class RecetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receta
        fields = '__all__'


# 🔹 Diagnostico
class DiagnosticoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Diagnostico
        fields = '__all__'