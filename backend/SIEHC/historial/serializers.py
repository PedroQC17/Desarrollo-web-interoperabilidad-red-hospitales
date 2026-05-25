from rest_framework import serializers
from historial.models import (
    Historial, Observacion, Examen, Receta, Diagnostico
)


# ─────────────────────────────────────────────
#  SERIALIZERS DE LECTURA ENRIQUECIDOS
#  Exponen campos legibles para el frontend
#  (nombre médico, hospital, etc.)
# ─────────────────────────────────────────────

class DiagnosticoSerializer(serializers.ModelSerializer):
    # Campos calculados para la UI (vista del paciente)
    medico_nombre    = serializers.SerializerMethodField()
    medico_especialidad = serializers.SerializerMethodField()
    hospital_nombre  = serializers.SerializerMethodField()

    class Meta:
        model  = Diagnostico
        fields = '__all__'

    # Sube por: historial → paciente → citas → medico
    # Busca la cita más reciente del paciente para este diagnóstico
    def _cita(self, obj):
        citas = obj.historial.paciente.citas.order_by('-inicio')
        return citas.first()

    def get_medico_nombre(self, obj):
        cita = self._cita(obj)
        return cita.medico.usuario.nombre if cita else None

    def get_medico_especialidad(self, obj):
        cita = self._cita(obj)
        return cita.medico.especialidad if cita else None

    def get_hospital_nombre(self, obj):
        cita = self._cita(obj)
        if cita and cita.medico.hospital:
            return cita.medico.hospital.nombre
        return None


class RecetaSerializer(serializers.ModelSerializer):
    medicamento_nombre = serializers.SerializerMethodField()
    medicamento_costo  = serializers.SerializerMethodField()  
    medico_nombre      = serializers.SerializerMethodField()
    hospital_nombre    = serializers.SerializerMethodField()

    class Meta:
        model  = Receta
        fields = '__all__'


    
    def _cita(self, obj):
        citas = obj.historial.paciente.citas.order_by('-inicio')
        return citas.first()

    def get_medicamento_nombre(self, obj):
        return obj.medicamento.nombre
    
    def get_medicamento_costo(self, obj):         
        return float(obj.medicamento.costo)

    def get_medico_nombre(self, obj):
        cita = self._cita(obj)
        return cita.medico.usuario.nombre if cita else None

    def get_hospital_nombre(self, obj):
        cita = self._cita(obj)
        if cita and cita.medico.hospital:
            return cita.medico.hospital.nombre
        return None


class ObservacionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Observacion
        fields = '__all__'


class ExamenSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Examen
        fields = '__all__'


# ─────────────────────────────────────────────
#  HISTORIAL COMPLETO (lectura anidada)
#  Devuelve todo el historial del paciente en 1 request
# ─────────────────────────────────────────────

class HistorialDetalleSerializer(serializers.ModelSerializer):
    diagnosticos  = DiagnosticoSerializer(many=True, read_only=True)
    recetas       = RecetaSerializer(many=True, read_only=True)
    observaciones = ObservacionSerializer(many=True, read_only=True)
    examenes      = ExamenSerializer(many=True, read_only=True)

    class Meta:
        model  = Historial
        fields = [
            'id', 'paciente', 'fecha_creacion', 'activo',
            'diagnosticos', 'recetas', 'observaciones', 'examenes',
        ]


# ─────────────────────────────────────────────
#  HISTORIAL SIMPLE (escritura / creación)
# ─────────────────────────────────────────────

class HistorialSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Historial
        fields = '__all__'