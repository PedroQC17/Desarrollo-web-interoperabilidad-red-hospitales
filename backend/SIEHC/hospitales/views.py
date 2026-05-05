from rest_framework import viewsets
from .models import Hospital
from .serializers import HospitalSerializer


class HospitalViewSet(viewsets.ModelViewSet):
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer

    # Opcional: filtrar solo activos
    def get_queryset(self):
        queryset = Hospital.objects.all()
        activo = self.request.query_params.get('activo')

        if activo is not None:
            queryset = queryset.filter(activo=activo)

        return queryset