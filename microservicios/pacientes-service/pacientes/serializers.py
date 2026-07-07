from rest_framework import serializers
from .models import Paciente, Historial, Observacion, Examen, Receta, Diagnostico


class PacienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paciente
        fields = "__all__"
        read_only_fields = ["creado_en"]


# serializer de diagnostico
class DiagnosticoSerializer(serializers.ModelSerializer):
    severidad_display = serializers.CharField(source="get_severidad_display", read_only=True)

    class Meta:
        model = Diagnostico
        fields = "__all__"


class RecetaSerializer(serializers.ModelSerializer):
    categoria_display = serializers.CharField(source="get_categoria_display", read_only=True)
    prioridad_display = serializers.CharField(source="get_prioridad_display", read_only=True)
    medicamento_nombre = serializers.SerializerMethodField()
    medicamento_costo = serializers.SerializerMethodField()
    medicamento_tipo = serializers.SerializerMethodField()

    class Meta:
        model = Receta
        fields = "__all__"

    def get_medicamento_nombre(self, obj):
        if hasattr(obj, '_med_nombre'):
            return obj._med_nombre
        if obj.medicamento_id and obj.medicamento_id > 0:
            return f"Medicamento #{obj.medicamento_id}"
        parts = obj.intencion.split(" || ", 1) if obj.intencion else ["", ""]
        return parts[0] or "Medicamento"

    def get_medicamento_costo(self, obj):
        return getattr(obj, '_med_costo', None)

    def get_medicamento_tipo(self, obj):
        return getattr(obj, '_med_tipo', "")

# serializer observacion
class ObservacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Observacion
        fields = "__all__"

# serializer examen
class ExamenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Examen
        fields = "__all__"

# serializer historial detalle
class HistorialDetalleSerializer(serializers.ModelSerializer):
    diagnosticos = DiagnosticoSerializer(many=True, read_only=True)
    recetas = RecetaSerializer(many=True, read_only=True)
    observaciones = ObservacionSerializer(many=True, read_only=True)
    examenes = ExamenSerializer(many=True, read_only=True)

    class Meta:
        model = Historial
        fields = ['id', 'paciente', 'fecha_creacion', 'activo',
                  'compartir_red', 'investigacion',
                  'diagnosticos', 'recetas', 'observaciones', 'examenes']

# serializer historial
class HistorialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Historial
        fields = "__all__"
