import re
import logging
import pdfplumber
from django.db import transaction
from django.utils import timezone

from .models import Historial, Diagnostico, Receta, Observacion

logger = logging.getLogger(__name__)

MESES_ES = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4,
    "mayo": 5, "junio": 6, "julio": 7, "agosto": 8,
    "septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
}


def _parsear_fecha(texto):
    from datetime import datetime as dt, timezone as tz
    if not texto:
        return timezone.now()
    match = re.search(r"(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+de\s+(\d{4})", texto.lower())
    if not match:
        return timezone.now()
    dia = int(match.group(1))
    mes = MESES_ES.get(match.group(2))
    anio = int(match.group(3))
    if not mes:
        return timezone.now()
    return dt(anio, mes, dia, tzinfo=tz.utc)


def _extraer_texto_completo(pdf):
    texto = ""
    for page in pdf.pages:
        t = page.extract_text()
        if t:
            texto += t + "\n"
    return texto


def _extraer_diagnosticos(texto):
    diagnosticos = []
    bloques = re.split(r"(?=^\s*\d+\.\s+)", texto, flags=re.MULTILINE)
    for bloque in bloques:
        titulo_match = re.match(r"^\s*\d+\.\s+(.+)", bloque)
        if not titulo_match:
            continue
        estado_clinico = titulo_match.group(1).strip()
        if len(estado_clinico) < 3:
            continue
        def _campo(patron, default=""):
            m = re.search(patron, bloque, re.IGNORECASE | re.DOTALL)
            return m.group(1).strip() if m else default
        categoria = _campo(r"Categor[ií]a:\s*([^\n]+)")
        ubicacion = _campo(r"[AÁ]rea:\s*([^\n]+)")
        fecha_texto = _campo(r"Fecha:\s*([^\n]+)")
        descripcion = _campo(r"Descripci[oó]n:\s*([\s\S]*?)(?=Nota:|^\s*\d+\.|$)")
        nota = _campo(r"Nota:\s*([\s\S]*?)(?=^\s*\d+\.|$)")
        sev_match = re.search(r"\b(leve|moderado|grave|cr[íi]tico)\b", bloque, re.IGNORECASE)
        severidad_map = {"leve": "leve", "moderado": "moderado", "grave": "grave", "crítico": "critico", "critico": "critico"}
        severidad = severidad_map.get(sev_match.group(1).lower() if sev_match else "leve", "leve")
        diagnosticos.append({
            "estado_clinico": estado_clinico, "categoria": categoria, "severidad": severidad,
            "ubicacion_anatomica": ubicacion, "fecha_hora_inicio": _parsear_fecha(fecha_texto),
            "edad_inicio": 0, "descripcion_inicio": descripcion, "nota": nota,
        })
    return diagnosticos


def _extraer_recetas_tabla(pdf):
    recetas = []
    for page in pdf.pages:
        tables = page.extract_tables()
        if not tables:
            continue
        for table in tables:
            if not table or len(table) < 2:
                continue
            header = [str(c).lower().strip() if c else "" for c in table[0]]
            if "medicamento" not in " ".join(header):
                continue
            idx_med = next((i for i, h in enumerate(header) if "medicamento" in h), 0)
            idx_dos = next((i for i, h in enumerate(header) if "dosis" in h or "instrucci" in h or "presentaci" in h), -1)
            idx_per = next((i for i, h in enumerate(header) if "periodo" in h or "frecuencia" in h), -1)
            idx_ind = next((i for i, h in enumerate(header) if "indicaci" in h or "intenci" in h or "motivo" in h), -1)
            if idx_dos == -1: idx_dos = 1 if len(header) > 1 else -1
            if idx_per == -1: idx_per = 2 if len(header) > 2 else -1
            if idx_ind == -1: idx_ind = 3 if len(header) > 3 else -1
            for row in table[1:]:
                if not row or not row[idx_med]:
                    continue
                nombre = str(row[idx_med]).strip() if row[idx_med] else ""
                if not nombre or len(nombre) < 2:
                    continue
                instruccion = str(row[idx_dos]).strip() if idx_dos >= 0 and idx_dos < len(row) and row[idx_dos] else ""
                periodo = str(row[idx_per]).strip() if idx_per >= 0 and idx_per < len(row) and row[idx_per] else ""
                intencion = str(row[idx_ind]).strip() if idx_ind >= 0 and idx_ind < len(row) and row[idx_ind] else ""
                recetas.append({"nombre": nombre, "instruccion_dosis": instruccion, "periodo_dosis": periodo, "intencion": intencion})
    return recetas


def _extraer_recetas_texto(texto):
    recetas = []
    lines = [l.strip() for l in texto.splitlines() if l.strip()]
    section_idx = next((i for i, line in enumerate(lines) if re.search(r'\b(medicamento|receta|f[aá]rmaco|droga|prescripción)\b', line.lower())), 0)
    med_lines = lines[section_idx + 1:]
    dosis_pattern = r'(\b(?:dosis|mg|ml|comprimid[oa]s?|tabletas?|cápsulas?|ampolla|inyección|gotas|IU|mcg)\b)'
    periodo_pattern = r'(\b(?:cada|diario|día|hora|semana|mes|mañana|tarde|noche|noches)\b)'
    i = 0
    while i < len(med_lines):
        linea = med_lines[i]
        if not linea:
            i += 1; continue
        if re.search(r'^(Cantidad|Periodo|Dosis|Indicación|Instrucción|Frecuencia|Observaciones?)\b', linea, re.IGNORECASE):
            i += 1; continue
        if re.search(dosis_pattern, linea, re.IGNORECASE):
            nombre = linea; instruccion, periodo, intencion = '', '', ''
            j = i + 1
            while j < len(med_lines) and j <= i + 3:
                next_line = med_lines[j]
                if re.search(r'^(Cantidad|Periodo|Dosis|Indicación|Instrucción|Frecuencia)\b', next_line, re.IGNORECASE):
                    j += 1; continue
                if not instruccion and re.search(dosis_pattern, next_line, re.IGNORECASE) and next_line != nombre:
                    instruccion = next_line; j += 1; continue
                if not periodo and re.search(periodo_pattern, next_line, re.IGNORECASE):
                    periodo = next_line; j += 1; continue
                if not intencion:
                    intencion = next_line; j += 1; continue
                j += 1
            recetas.append({'nombre': nombre, 'instruccion_dosis': instruccion, 'periodo_dosis': periodo, 'intencion': intencion})
            i = j; continue
        if i + 1 < len(med_lines) and re.search(dosis_pattern, med_lines[i + 1], re.IGNORECASE):
            recetas.append({'nombre': linea, 'instruccion_dosis': med_lines[i+1], 'periodo_dosis': med_lines[i+2] if i+2 < len(med_lines) else '', 'intencion': med_lines[i+3] if i+3 < len(med_lines) else ''})
            i += 4; continue
        match = re.search(r'^(?:Medicamento|Medicaci[oó]n|F[aá]rmaco)[:\-]?\s*(.+)$', linea, re.IGNORECASE)
        if match:
            recetas.append({'nombre': match.group(1).strip(), 'instruccion_dosis': med_lines[i+1] if i+1 < len(med_lines) else '', 'periodo_dosis': med_lines[i+2] if i+2 < len(med_lines) else '', 'intencion': med_lines[i+3] if i+3 < len(med_lines) else ''})
            i += 4; continue
        i += 1
    return recetas


def procesar_pdf_historial(paciente, archivo, medicamento_resolver=None):
    historial, _ = Historial.objects.get_or_create(paciente=paciente)
    diagnosticos_creados = 0
    recetas_creadas = 0
    observaciones_creadas = 0
    recetas_omitidas = []
    try:
        with pdfplumber.open(archivo) as pdf:
            texto = _extraer_texto_completo(pdf)
            diagnosticos_data = _extraer_diagnosticos(texto)
            recetas_data = _extraer_recetas_tabla(pdf)
            if not recetas_data:
                recetas_data = _extraer_recetas_texto(texto)
    except Exception:
        diagnosticos_data = []
        recetas_data = []
        texto = ""
    with transaction.atomic():
        for d in diagnosticos_data:
            try:
                Diagnostico.objects.create(historial=historial, **d)
                diagnosticos_creados += 1
            except Exception:
                continue
        for r in recetas_data:
            try:
                nombre = str(r.get("nombre", "")).strip()
                if len(nombre) < 2:
                    continue
                med_id = 0
                if medicamento_resolver:
                    med_id = medicamento_resolver(nombre) or 0
                intencion = r.get("intencion", "")
                Receta.objects.create(
                    historial=historial, medicamento_id=med_id,
                    instruccion_dosis=r.get("instruccion_dosis", ""),
                    periodo_dosis=r.get("periodo_dosis", ""),
                    intencion=f"{nombre} || {intencion}" if intencion else nombre,
                    categoria="libre", prioridad="media", cantidad_suministrada=1,
                )
                recetas_creadas += 1
            except Exception:
                continue
        if texto:
            motivo_match = re.search(r"[Mm]otivo\s*(?:de\s*consulta)?[:\-]?\s*([^\n]{5,120})", texto)
            if motivo_match:
                try:
                    Observacion.objects.create(historial=historial, motivo_consulta=motivo_match.group(1).strip(), antecedentes_patologicos="Importado desde PDF")
                    observaciones_creadas += 1
                except Exception:
                    pass
    return {
        "historial_id": historial.id, "diagnosticos_creados": diagnosticos_creados,
        "recetas_creadas": recetas_creadas, "observaciones_creadas": observaciones_creadas,
        "recetas_omitidas": recetas_omitidas,
    }
