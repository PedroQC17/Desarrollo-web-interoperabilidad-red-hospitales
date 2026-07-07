from rest_framework import serializers
from .models import Medicamento, Despacho, DespachoItem


class MedicamentoSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source="get_tipo_display", read_only=True)
    hay_stock = serializers.SerializerMethodField()

    class Meta:
        model = Medicamento
        fields = "__all__"

    def get_hay_stock(self, obj):
        return obj.hay_stock(1)


class DespachoItemInputSerializer(serializers.Serializer):
    medicamento_id = serializers.IntegerField(required=False)
    medicamento = serializers.IntegerField(required=False)
    cantidad = serializers.IntegerField(min_value=1)

    def validate(self, data):
        if not data.get("medicamento_id") and not data.get("medicamento"):
            raise serializers.ValidationError({"medicamento_id": "Campo requerido (medicamento_id o medicamento)"})
        return data


class DespachoInputSerializer(serializers.Serializer):
    paciente_id = serializers.IntegerField(required=False)
    paciente_nombre = serializers.CharField(required=False, allow_blank=True)
    cita_id = serializers.IntegerField(required=False)
    items = DespachoItemInputSerializer(many=True)

    def validate_items(self, items):
        for item in items:
            if not item.get("medicamento_id") and item.get("medicamento"):
                item["medicamento_id"] = item["medicamento"]
        return items


class DespachoItemOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = DespachoItem
        fields = "__all__"
        read_only_fields = ["subtotal"]


class DespachoSerializer(serializers.ModelSerializer):
    items = DespachoItemOutputSerializer(many=True, read_only=True)

    class Meta:
        model = Despacho
        fields = "__all__"
        read_only_fields = ["fecha_despacho", "total"]
