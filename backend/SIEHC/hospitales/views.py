from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Hospital
from .serializers import HospitalSerializer
from citas.models import Cita
from services.gestion_administrador.permisos import EsAdministrador


class HospitalViewSet(viewsets.ModelViewSet):
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'reporte']:
            return [IsAuthenticated()]
        return [EsAdministrador()]

    def get_queryset(self):
        queryset = Hospital.objects.all()
        user = getattr(self.request, 'user', None)
        if user and getattr(user, 'is_staff', False):
            return queryset

        activo = self.request.query_params.get('activo')
        if activo is None:
            return queryset.filter(activo=True)

        activo_val = str(activo).lower()
        if activo_val in ("1", "true", "yes", "on"):
            return queryset.filter(activo=True)
        if activo_val in ("0", "false", "no", "off"):
            return queryset.filter(activo=False)

        return queryset

    @action(detail=True, methods=['post'])
    def desafiliar(self, request, pk=None):
        hospital = self.get_object()
        motivo = request.data.get('motivo', '')
        hospital.activo = False
        hospital.fecha_desactivacion = timezone.now()
        hospital.motivo_desactivacion = motivo
        hospital.save()
        return Response({'mensaje': f'Hospital "{hospital.nombre}" desafiliado correctamente.'})

    @action(detail=False, methods=['get'])
    def reporte(self, request):
        desde = request.query_params.get('desde')
        hasta = request.query_params.get('hasta')

        citas_qs = Cita.objects.filter(estado='completada')

        if desde:
            citas_qs = citas_qs.filter(inicio__gte=desde)
        if hasta:
            citas_qs = citas_qs.filter(inicio__lte=hasta)

        # Citas por hospital
        citas_por_hospital = citas_qs.values(
            'medico__usuario__medico__hospital__id',
            'medico__usuario__medico__hospital__nombre',
        ).annotate(total_citas=Count('id'))

        # Médicos activos por hospital
        from usuarios.models import Medico
        medicos_por_hospital = Medico.objects.filter(
            disponibilidad=True
        ).values(
            'hospital__id',
            'hospital__nombre',
        ).annotate(total_medicos=Count('id'))

        # Combinar datos
        medicos_map = {}
        for m in medicos_por_hospital:
            hid = m['hospital__id']
            medicos_map[hid] = m['total_medicos']

        reporte_data = []
        for item in citas_por_hospital:
            hid = item['medico__usuario__medico__hospital__id']
            reporte_data.append({
                'hospital__id': hid,
                'hospital__nombre': item['medico__usuario__medico__hospital__nombre'],
                'total_citas': item['total_citas'],
                'total_medicos': medicos_map.get(hid, 0),
            })

        # Incluir hospitales sin citas
        hospitales_con_datos = {r['hospital__id'] for r in reporte_data}
        for m in medicos_por_hospital:
            hid = m['hospital__id']
            if hid not in hospitales_con_datos:
                reporte_data.append({
                    'hospital__id': hid,
                    'hospital__nombre': m['hospital__nombre'],
                    'total_citas': 0,
                    'total_medicos': m['total_medicos'],
                })

        return Response(reporte_data)
