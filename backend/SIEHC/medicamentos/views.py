from rest_framework import viewsets
from .models import Medicamento
from .serializers import MedicamentoSerializer


class MedicamentoViewSet(viewsets.ModelViewSet):
    queryset = Medicamento.objects.select_related('hospital').all()
    serializer_class = MedicamentoSerializer

    def get_queryset(self):
        queryset = Medicamento.objects.select_related('hospital').all()

        hospital_id = self.request.query_params.get('hospital')
        tipo = self.request.query_params.get('tipo')
        activo = self.request.query_params.get('activo')

        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)

        if tipo:
            queryset = queryset.filter(tipo=tipo)

        if activo is not None:
            queryset = queryset.filter(activo=activo)

        return queryset