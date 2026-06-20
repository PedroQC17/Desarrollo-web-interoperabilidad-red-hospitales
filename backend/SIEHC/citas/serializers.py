from rest_framework import serializers
from citas.models import Cita
from facturacion.models import Facturacion


# ─────────────────────────────────────────────────────────────────────────────
#  LECTURA — datos enriquecidos para el frontend
# ─────────────────────────────────────────────────────────────────────────────

class CitaLecturaSerializer(serializers.ModelSerializer):
    duracion_minutos      = serializers.SerializerMethodField()
    medico_nombre         = serializers.CharField(source="medico.usuario.nombre",   read_only=True)
    medico_especialidad   = serializers.CharField(source="medico.especialidad",     read_only=True)
    medico_disponibilidad = serializers.BooleanField(source="medico.disponibilidad",read_only=True)
    hospital_id           = serializers.IntegerField(source="medico.hospital.id",   read_only=True)
    hospital_nombre       = serializers.CharField(source="medico.hospital.nombre",  read_only=True)
    paciente_nombre       = serializers.CharField(source="paciente.usuario.nombre", read_only=True)
    estado_display        = serializers.CharField(source="get_estado_display",      read_only=True)
    tipo_display          = serializers.CharField(source="get_tipo_display",        read_only=True)
    prioridad_display     = serializers.CharField(source="get_prioridad_display",   read_only=True)

    class Meta:
        model  = Cita
        fields = [
            "id",
            "tipo", "tipo_display",
            "categoria_servicio", "especialidad",
            "prioridad", "prioridad_display",
            "estado", "estado_display",
            "inicio", "fin", "duracion_minutos",
            "fecha_solicitud", "fecha_cancelacion",
            "nota", "costo_servicio",
            "medico", "medico_nombre", "medico_especialidad", "medico_disponibilidad",
            "hospital_id", "hospital_nombre",
            "paciente", "paciente_nombre",
        ]

    def get_duracion_minutos(self, obj):
        return obj.duracion_minutos()


# ─────────────────────────────────────────────────────────────────────────────
#  ESCRITURA — crear cita (POST desde el service)
# ─────────────────────────────────────────────────────────────────────────────

class CitaEscrituraSerializer(serializers.ModelSerializer):
    duracion_minutos = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model  = Cita
        fields = "__all__"
        read_only_fields = ["estado", "fecha_solicitud", "fecha_cancelacion"]

    def get_duracion_minutos(self, obj):
        return obj.duracion_minutos()

    def validate(self, data):
        inicio = data.get("inicio")
        fin    = data.get("fin")
        if inicio and fin and fin <= inicio:
            raise serializers.ValidationError("La fecha de fin debe ser mayor que la de inicio.")
        return data


# ─────────────────────────────────────────────────────────────────────────────
#  MÉDICO DISPONIBLE — selector del frontend (HU06)
# ─────────────────────────────────────────────────────────────────────────────

class MedicoDisponibleSerializer(serializers.Serializer):
    id              = serializers.IntegerField(source="pk")
    nombre          = serializers.CharField(source="usuario.nombre")
    especialidad    = serializers.CharField()
    periodo         = serializers.CharField()
    ubicacion       = serializers.CharField()
    hospital_id     = serializers.IntegerField(source="hospital.id",    allow_null=True)
    hospital_nombre = serializers.CharField(source="hospital.nombre",   allow_null=True)
    disponibilidad  = serializers.BooleanField()


# ─────────────────────────────────────────────────────────────────────────────
#  RESUMEN DE PAGO — respuesta de GET /citas/<pk>/resumen-pago/ (HU13)
# ─────────────────────────────────────────────────────────────────────────────

class MedicamentoResumenSerializer(serializers.Serializer):
    medicamento = serializers.CharField()
    cantidad    = serializers.IntegerField()
    costo_unit  = serializers.FloatField()
    subtotal    = serializers.FloatField()


class ResumenPagoSerializer(serializers.Serializer):
    cita_id            = serializers.IntegerField()
    paciente           = serializers.CharField()
    especialidad       = serializers.CharField()
    costo_consulta     = serializers.FloatField()
    medicamentos       = MedicamentoResumenSerializer(many=True)
    costo_medicamentos = serializers.FloatField()
    monto_total        = serializers.FloatField()


# ─────────────────────────────────────────────────────────────────────────────
#  FACTURA — respuesta de POST /citas/<pk>/pagar/ (HU13)
# ─────────────────────────────────────────────────────────────────────────────

class FacturacionAtencionSerializer(serializers.ModelSerializer):
    cita_id             = serializers.IntegerField(source="cita.id",                  read_only=True)
    paciente_nombre     = serializers.CharField(source="cita.paciente.usuario.nombre",read_only=True)
    medico_nombre       = serializers.CharField(source="cita.medico.usuario.nombre",  read_only=True)
    estado_pago_display = serializers.CharField(source="get_estado_pago_display",     read_only=True)

    class Meta:
        model  = Facturacion
        fields = [
            "id",
            "cita_id", "paciente_nombre", "medico_nombre",
            "descripcion", "monto_total",
            "estado_pago", "estado_pago_display",
            "fecha_emitida",
        ]