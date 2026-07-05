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
    medicamento_id = serializers.IntegerField()
    cantidad = serializers.IntegerField(min_value=1)


class DespachoInputSerializer(serializers.Serializer):
    cita_id = serializers.IntegerField()
    items = DespachoItemInputSerializer(many=True)


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
