from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated

from historial.models import (
    Historial, Observacion, Examen, Receta, Diagnostico
)

from historial.serializers import (
    HistorialSerializer, ObservacionSerializer,
    ExamenSerializer, RecetaSerializer, DiagnosticoSerializer
)


# 🔹 HISTORIAL
class HistorialViewSet(ModelViewSet):
    queryset = Historial.objects.all()
    serializer_class = HistorialSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if hasattr(user, 'paciente'):
            return Historial.objects.filter(paciente=user.paciente)

        return super().get_queryset()


# 🔹 OBSERVACION
class ObservacionViewSet(ModelViewSet):
    queryset = Observacion.objects.all()
    serializer_class = ObservacionSerializer
    permission_classes = [IsAuthenticated]


# 🔹 EXAMEN
class ExamenViewSet(ModelViewSet):
    queryset = Examen.objects.all()
    serializer_class = ExamenSerializer
    permission_classes = [IsAuthenticated]


# 🔹 RECETA
class RecetaViewSet(ModelViewSet):
    queryset = Receta.objects.all()
    serializer_class = RecetaSerializer
    permission_classes = [IsAuthenticated]


# 🔹 DIAGNOSTICO
class DiagnosticoViewSet(ModelViewSet):
    queryset = Diagnostico.objects.all()
    serializer_class = DiagnosticoSerializer
    permission_classes = [IsAuthenticated]