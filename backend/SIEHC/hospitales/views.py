from io import BytesIO
from django.db.models import Count, Q
from django.http import HttpResponse
from django.utils import timezone
from fpdf import FPDF
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
        if self.action in ['list', 'retrieve', 'reporte', 'reporte_pdf']:
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

    @action(detail=False, methods=['get'])
    def reporte_pdf(self, request):
        desde = request.query_params.get('desde')
        hasta = request.query_params.get('hasta')

        citas_qs = Cita.objects.filter(estado='completada')
        if desde:
            citas_qs = citas_qs.filter(inicio__gte=desde)
        if hasta:
            citas_qs = citas_qs.filter(inicio__lte=hasta)

        citas_por_hospital = citas_qs.values(
            'medico__usuario__medico__hospital__id',
            'medico__usuario__medico__hospital__nombre',
        ).annotate(total_citas=Count('id'))

        from usuarios.models import Medico
        medicos_por_hospital = Medico.objects.filter(
            disponibilidad=True
        ).values(
            'hospital__id', 'hospital__nombre',
        ).annotate(total_medicos=Count('id'))

        medicos_map = {m['hospital__id']: m['total_medicos'] for m in medicos_por_hospital}

        reporte_data = []
        for item in citas_por_hospital:
            hid = item['medico__usuario__medico__hospital__id']
            reporte_data.append(dict(
                hospital=item['medico__usuario__medico__hospital__nombre'] or "—",
                citas=item['total_citas'],
                medicos=medicos_map.get(hid, 0),
            ))

        ids_con_citas = {item['medico__usuario__medico__hospital__id'] for item in citas_por_hospital}
        for m in medicos_por_hospital:
            if m['hospital__id'] and m['hospital__id'] not in ids_con_citas:
                reporte_data.append(dict(
                    hospital=m['hospital__nombre'] or "—",
                    citas=0,
                    medicos=m['total_medicos'],
                ))

        total_citas = sum(r['citas'] for r in reporte_data)
        total_medicos = sum(r['medicos'] for r in reporte_data)

        pdf = FPDF()
        pdf.add_page()
        pdf.set_font('Helvetica', 'B', 16)
        pdf.cell(0, 10, 'SIEHC - Reporte de Hospitales', new_x='LMARGIN', new_y='NEXT', align='C')
        pdf.ln(4)

        pdf.set_font('Helvetica', '', 10)
        rango = f"Desde: {desde if desde else 'N/A'}  Hasta: {hasta if hasta else 'N/A'}"
        pdf.cell(0, 6, rango, new_x='LMARGIN', new_y='NEXT', align='C')
        pdf.cell(0, 6, f'Generado: {timezone.now().strftime("%d/%m/%Y %H:%M")}', new_x='LMARGIN', new_y='NEXT', align='C')
        pdf.ln(6)

        col_w = [10, 80, 50, 40]
        headers = ['N.', 'Hospital', 'Citas', 'Med. Activos']

        pdf.set_font('Helvetica', 'B', 10)
        pdf.set_fill_color(230, 230, 230)
        for i, h in enumerate(headers):
            pdf.cell(col_w[i], 8, h, border=1, align='C', fill=True)
        pdf.ln()

        pdf.set_font('Helvetica', '', 10)
        for idx, r in enumerate(reporte_data, 1):
            pdf.cell(col_w[0], 7, str(idx), border=1, align='C')
            pdf.cell(col_w[1], 7, r['hospital'], border=1)
            pdf.cell(col_w[2], 7, str(r['citas']), border=1, align='C')
            pdf.cell(col_w[3], 7, str(r['medicos']), border=1, align='C')
            pdf.ln()

        pdf.set_font('Helvetica', 'B', 10)
        pdf.cell(col_w[0] + col_w[1], 8, 'Totales', border=1, align='R')
        pdf.cell(col_w[2], 8, str(total_citas), border=1, align='C')
        pdf.cell(col_w[3], 8, str(total_medicos), border=1, align='C')

        buf = BytesIO()
        pdf.output(buf)
        buf.seek(0)

        return HttpResponse(buf, content_type='application/pdf',
                            headers={'Content-Disposition': 'attachment; filename="reporte_hospitales.pdf"'})
