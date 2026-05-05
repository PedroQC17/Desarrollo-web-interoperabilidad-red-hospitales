from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated

from citas.models import Cita
from citas.serializers import CitaSerializer


class CitaViewSet(ModelViewSet):
    queryset = Cita.objects.all()
    serializer_class = CitaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # 🔥 Filtrado según tipo de usuario
        if hasattr(user, 'paciente'):
            return Cita.objects.filter(paciente=user.paciente)

        if hasattr(user, 'medico'):
            return Cita.objects.filter(medico=user.medico)

        return super().get_queryset()