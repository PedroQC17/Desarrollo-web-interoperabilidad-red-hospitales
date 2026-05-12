from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Hospital
from .serializers import HospitalSerializer
from services.gestion_administrador.permisos import EsAdministrador


class HospitalViewSet(viewsets.ModelViewSet):
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer

    def get_permissions(self):
        """
        GET (listar/detalle) → cualquier usuario autenticado
        POST, PUT, PATCH, DELETE → solo ADMIN
        """
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [EsAdministrador()]

    def get_queryset(self):
        queryset = Hospital.objects.all()
        activo = self.request.query_params.get('activo')
        if activo is not None:
            queryset = queryset.filter(activo=activo)
        return queryset