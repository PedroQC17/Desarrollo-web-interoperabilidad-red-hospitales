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
        # Si el usuario es staff/administrador queremos permitir ver todos
        user = getattr(self.request, 'user', None)
        if user and getattr(user, 'is_staff', False):
            return queryset

        # Por defecto devolver solo hospitales activos, pero respetar
        # el parámetro ?activo=true|false cuando se provea.
        activo = self.request.query_params.get('activo')
        if activo is None:
            return queryset.filter(activo=True)

        activo_val = str(activo).lower()
        if activo_val in ("1", "true", "yes", "on"):
            return queryset.filter(activo=True)
        if activo_val in ("0", "false", "no", "off"):
            return queryset.filter(activo=False)

        # Si viene un valor inesperado, no filtrar por activo para evitar
        # ocultar resultados por error de parsing.
        return queryset