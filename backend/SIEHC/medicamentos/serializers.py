from rest_framework import serializers
from .models import Medicamento, Despacho, DespachoItem


# ─────────────────────────────────────────────────────────────────────────────
#  SERIALIZER EXISTENTE (sin cambios)
# ─────────────────────────────────────────────────────────────────────────────

class MedicamentoSerializer(serializers.ModelSerializer):
    hospital_nombre = serializers.CharField(source="hospital.nombre", read_only=True)
    tipo_display    = serializers.CharField(source="get_tipo_display", read_only=True)
    hay_stock       = serializers.SerializerMethodField()

    class Meta:
        model  = Medicamento
        fields = "__all__"

    def get_hay_stock(self, obj):
        return obj.hay_stock(1)


# ─────────────────────────────────────────────────────────────────────────────
#  DESPACHO INPUT — valida el body de POST /despachar/<cita_pk>/ (HU12)
# ─────────────────────────────────────────────────────────────────────────────

class DespachoItemSerializer(serializers.Serializer):
    medicamento = serializers.IntegerField()
    cantidad    = serializers.IntegerField(min_value=1)


class DespachoInputSerializer(serializers.Serializer):
    items = DespachoItemSerializer(many=True)


# ─────────────────────────────────────────────────────────────────────────────
#  DESPACHO OUTPUT — respuesta del despacho realizado
# ─────────────────────────────────────────────────────────────────────────────

class DespachoItemOutputSerializer(serializers.ModelSerializer):
    medicamento_nombre = serializers.CharField(source="medicamento.nombre", read_only=True)
    medicamento_id     = serializers.IntegerField(source="medicamento.id", read_only=True)

    class Meta:
        model  = DespachoItem
        fields = ['medicamento_id', 'medicamento_nombre', 'cantidad', 'precio_unitario', 'subtotal']
        read_only_fields = ['subtotal']


class DespachoSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.CharField(source="cita.paciente.usuario.nombre", read_only=True)
    paciente_id     = serializers.IntegerField(source="cita.paciente.id", read_only=True)
    items           = DespachoItemOutputSerializer(many=True, read_only=True)
    medico_nombre   = serializers.CharField(source="medico.usuario.nombre", read_only=True)

    class Meta:
        model  = Despacho
        fields = ['id', 'cita', 'paciente_id', 'paciente_nombre', 'medico_nombre', 'fecha_despacho', 'total', 'items']
        read_only_fields = ['id', 'fecha_despacho', 'total']