import pdfplumber
from django.db import transaction
from historial.models import Historial, Diagnostico, Receta, Observacion
from medicamentos.models import Medicamento
from usuarios.models import Paciente


MESES_ES = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4,
    "mayo": 5, "junio": 6, "julio": 7, "agosto": 8,
    "septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
}

SEVERIDAD_MAP = {
    "leve": "leve", "moderado": "moderado",
    "grave": "grave", "crítico": "critico", "critico": "critico",
}


def _parsear_fecha(texto: str) -> str:
    import re
    from django.utils import timezone

    if not texto:
        return timezone.now().isoformat()

    match = re.search(
        r"(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+de\s+(\d{4})",
        texto.lower()
    )
    if not match:
        return timezone.now().isoformat()

    dia   = int(match.group(1))
    mes   = MESES_ES.get(match.group(2))
    anio  = int(match.group(3))

    if not mes:
        return timezone.now().isoformat()

    from datetime import datetime, timezone as tz
    return datetime(anio, mes, dia, tzinfo=tz.utc).isoformat()


def _extraer_texto_completo(pdf) -> str:
    """Extrae todo el texto del PDF página por página."""
    texto = ""
    for page in pdf.pages:
        t = page.extract_text()
        if t:
            texto += t + "\n"
    return texto


def _extraer_diagnosticos(texto: str) -> list[dict]:
    import re
    diagnosticos = []

    bloques = re.split(r"(?=^\s*\d+\.\s+)", texto, flags=re.MULTILINE)

    for bloque in bloques:
        titulo_match = re.match(r"^\s*\d+\.\s+(.+)", bloque)
        if not titulo_match:
            continue

        estado_clinico = titulo_match.group(1).strip()
        if len(estado_clinico) < 3:
            continue

        def extraer_campo(patron, texto_bloque, default=""):
            m = re.search(patron, texto_bloque, re.IGNORECASE | re.DOTALL)
            return m.group(1).strip() if m else default

        categoria      = extraer_campo(r"Categor[ií]a:\s*([^\n]+)", bloque)
        ubicacion      = extraer_campo(r"[AÁ]rea:\s*([^\n]+)", bloque)
        fecha_texto    = extraer_campo(r"Fecha:\s*([^\n]+)", bloque)
        descripcion    = extraer_campo(
            r"Descripci[oó]n:\s*([\s\S]*?)(?=Nota:|^\s*\d+\.|$)", bloque
        )
        nota           = extraer_campo(
            r"Nota:\s*([\s\S]*?)(?=^\s*\d+\.|$)", bloque
        )

        sev_match = re.search(r"\b(leve|moderado|grave|cr[íi]tico)\b", bloque, re.IGNORECASE)
        severidad = SEVERIDAD_MAP.get(sev_match.group(1).lower() if sev_match else "leve", "leve")

        diagnosticos.append({
            "estado_clinico":      estado_clinico,
            "categoria":           categoria,
            "severidad":           severidad,
            "ubicacion_anatomica": ubicacion,
            "fecha_hora_inicio":   _parsear_fecha(fecha_texto),
            "edad_inicio":         0,
            "descripcion_inicio":  descripcion,
            "nota":                nota,
        })

    return diagnosticos


def _extraer_recetas_tabla(pdf) -> list[dict]:
    """
    Extrae recetas desde tablas en el PDF usando pdfplumber.
    """
    recetas = []
    for page in pdf.pages:
        tables = page.extract_tables()
        if not tables:
            continue
        
        for table in tables:
            if not table or len(table) < 2:
                continue
            
            # Buscar si es tabla de medicamentos
            header = [str(c).lower().strip() if c else "" for c in table[0]]
            if "medicamento" not in " ".join(header):
                continue
            
            # Encontrar índices de columnas (más flexible)
            idx_med = next((i for i, h in enumerate(header) if "medicamento" in h), 0)
            idx_dos = next((i for i, h in enumerate(header) if "dosis" in h or "instrucci" in h or "presentaci" in h), -1)
            idx_per = next((i for i, h in enumerate(header) if "periodo" in h or "periodo" in h or "frecuencia" in h), -1)
            idx_ind = next((i for i, h in enumerate(header) if "indicaci" in h or "intenci" in h or "motivo" in h), -1)
            
            # Si no encontró columnas, usar posiciones por defecto
            if idx_dos == -1:
                idx_dos = 1 if len(header) > 1 else -1
            if idx_per == -1:
                idx_per = 2 if len(header) > 2 else -1
            if idx_ind == -1:
                idx_ind = 3 if len(header) > 3 else -1
            
            # Procesar filas
            for row in table[1:]:
                if not row or not row[idx_med]:
                    continue
                
                nombre = str(row[idx_med]).strip() if row[idx_med] else ""
                if not nombre or len(nombre) < 2:
                    continue
                
                instruccion = str(row[idx_dos]).strip() if idx_dos >= 0 and idx_dos < len(row) and row[idx_dos] else ""
                periodo = str(row[idx_per]).strip() if idx_per >= 0 and idx_per < len(row) and row[idx_per] else ""
                intencion = str(row[idx_ind]).strip() if idx_ind >= 0 and idx_ind < len(row) and row[idx_ind] else ""
                
                recetas.append({
                    "nombre":            nombre,
                    "instruccion_dosis": instruccion,
                    "periodo_dosis":     periodo,
                    "intencion":         intencion,
                })
    
    return recetas


def _extraer_recetas_texto(texto: str) -> list[dict]:
    """
    Fallback: extrae recetas a partir del texto cuando no hay tablas.
    Busca patrones de medicamentos y luego usa las líneas siguientes para
    completar dosis, periodo e indicaciones.
    """
    recetas = []
    import re
    
    lines = [l.strip() for l in texto.splitlines() if l.strip()]
    
    # Buscar índice de la sección de recetas / medicamentos
    section_idx = next(
        (i for i, line in enumerate(lines)
         if re.search(r'\b(medicamento|receta|f[aá]rmaco|droga|prescripción)\b', line.lower())),
        0
    )
    
    med_lines = lines[section_idx + 1:]
    
    dosis_pattern = r'(\b(?:dosis|mg|ml|comprimid[oa]s?|tabletas?|cápsulas?|ampolla|inyección|gotas|IU|mcg)\b)'
    periodo_pattern = r'(\b(?:cada|diario|día|hora|semana|mes|mañana|tarde|noche|noches|por la mañana|por la tarde)\b)'
    
    i = 0
    while i < len(med_lines):
        linea = med_lines[i]
        
        if not linea:
            i += 1
            continue
        
        # Evitar encabezados de sección y separadores
        if re.search(r'^(Cantidad|Periodo|Dosis|Indicación|Instrucción|Frecuencia|Observaciones?)\b', linea, re.IGNORECASE):
            i += 1
            continue
        
        # Si la línea parece contener una receta completa (nombre + dosis)
        if re.search(dosis_pattern, linea, re.IGNORECASE):
            nombre = linea
            instruccion = ''
            periodo = ''
            intencion = ''
            j = i + 1
            while j < len(med_lines) and j <= i + 3:
                next_line = med_lines[j]
                if re.search(r'^(Cantidad|Periodo|Dosis|Indicación|Instrucción|Frecuencia)\b', next_line, re.IGNORECASE):
                    j += 1
                    continue
                if not instruccion and re.search(dosis_pattern, next_line, re.IGNORECASE):
                    if next_line != nombre:
                        instruccion = next_line
                        j += 1
                        continue
                if not periodo and re.search(periodo_pattern, next_line, re.IGNORECASE):
                    periodo = next_line
                    j += 1
                    continue
                if not intencion:
                    intencion = next_line
                    j += 1
                    continue
                j += 1
            recetas.append({
                'nombre': nombre,
                'instruccion_dosis': instruccion,
                'periodo_dosis': periodo,
                'intencion': intencion,
            })
            i = j
            continue
        
        # Si la línea siguiente parece contener dosis, tomar la línea actual como nombre
        if i + 1 < len(med_lines) and re.search(dosis_pattern, med_lines[i + 1], re.IGNORECASE):
            nombre = linea
            instruccion = med_lines[i + 1]
            periodo = med_lines[i + 2] if i + 2 < len(med_lines) else ''
            intencion = med_lines[i + 3] if i + 3 < len(med_lines) else ''
            recetas.append({
                'nombre': nombre,
                'instruccion_dosis': instruccion,
                'periodo_dosis': periodo,
                'intencion': intencion,
            })
            i += 4
            continue
        
        # Si la línea parece un medicamento con etiqueta explícita
        match = re.search(r'^(?:Medicamento|Medicaci[oó]n|F[aá]rmaco)[:\-]?\s*(.+)$', linea, re.IGNORECASE)
        if match:
            nombre = match.group(1).strip()
            instruccion = med_lines[i + 1] if i + 1 < len(med_lines) else ''
            periodo = med_lines[i + 2] if i + 2 < len(med_lines) else ''
            intencion = med_lines[i + 3] if i + 3 < len(med_lines) else ''
            recetas.append({
                'nombre': nombre,
                'instruccion_dosis': instruccion,
                'periodo_dosis': periodo,
                'intencion': intencion,
            })
            i += 4
            continue
        
        i += 1
    
    return recetas


def _resolver_medicamento(nombre: str):
    """
    Busca el medicamento en la BD por nombre.
    Intenta búsquedas progresivamente más flexibles.
    """
    if not nombre:
        return None
    
    # Intento 1: búsqueda exacta icontains
    med = Medicamento.objects.filter(
        nombre__icontains=nombre,
        activo=True
    ).first()
    if med:
        return med
    
    # Intento 2: primera palabra
    primera_palabra = nombre.split()[0] if nombre else ""
    if primera_palabra and len(primera_palabra) > 2:
        med = Medicamento.objects.filter(
            nombre__icontains=primera_palabra,
            activo=True
        ).first()
        if med:
            return med
    
    # Intento 3: búsqueda sin acentos/caracteres especiales
    nombre_clean = nombre.lower().replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u').replace('ñ', 'n')
    med = Medicamento.objects.filter(nombre__icontains=nombre_clean, activo=True).first()
    if med:
        return med

    # Intento 4: buscar por palabras relevantes del nombre
    palabras = [p for p in nombre_clean.split() if len(p) > 2]
    for palabra in palabras:
        med = Medicamento.objects.filter(nombre__icontains=palabra, activo=True).first()
        if med:
            return med

    return None


def procesar_pdf_historial(paciente: Paciente, archivo) -> dict:
    import logging
    logger = logging.getLogger(__name__)
    
    historial, _ = Historial.objects.get_or_create(paciente=paciente)

    diagnosticos_creados  = 0
    recetas_creadas       = 0
    observaciones_creadas = 0
    recetas_omitidas      = []

    try:
        with pdfplumber.open(archivo) as pdf:
            texto = _extraer_texto_completo(pdf)
            logger.info(f"Texto extraído del PDF: {len(texto)} caracteres")
            
            diagnosticos_data = _extraer_diagnosticos(texto)
            logger.info(f"Diagnósticos detectados: {len(diagnosticos_data)}")
            
            recetas_data = _extraer_recetas_tabla(pdf)
            logger.info(f"Recetas desde tabla: {len(recetas_data)}")
            
            # Si no se detectaron tablas, intentar extracción por texto
            if not recetas_data:
                recetas_data = _extraer_recetas_texto(texto)
                logger.info(f"Recetas desde texto: {len(recetas_data)}")
    except Exception as e:
        logger.error(f"Error al extraer PDF: {str(e)}")
        recetas_data = []
        diagnosticos_data = []
        texto = ""

    with transaction.atomic():
        # Guardar diagnósticos
        for d in diagnosticos_data:
            try:
                Diagnostico.objects.create(historial=historial, **d)
                diagnosticos_creados += 1
            except Exception as e:
                logger.warning(f"Error al guardar diagnóstico: {str(e)}")
                continue

        # Guardar recetas (solo si el medicamento existe en el catálogo)
        for r in recetas_data:
            try:
                if not r.get("nombre") or len(str(r["nombre"]).strip()) < 2:
                    continue
                
                medicamento = _resolver_medicamento(str(r["nombre"]).strip())
                if not medicamento:
                    logger.info(f"Medicamento no encontrado: {r['nombre']}")
                    recetas_omitidas.append(r["nombre"])
                    continue
                
                Receta.objects.create(
                    historial=historial,
                    medicamento=medicamento,
                    instruccion_dosis=r.get("instruccion_dosis", ""),
                    periodo_dosis=r.get("periodo_dosis", ""),
                    intencion=r.get("intencion", ""),
                    categoria="libre",
                    prioridad="media",
                    cantidad_suministrada=1,
                )
                recetas_creadas += 1
            except Exception as e:
                logger.warning(f"Error al guardar receta {r.get('nombre')}: {str(e)}")
                continue

        # Guardar observación general del motivo
        if texto:
            import re
            motivo_match = re.search(r"[Mm]otivo\s*(?:de\s*consulta)?[:\-]?\s*([^\n]{5,120})", texto)
            if motivo_match:
                try:
                    Observacion.objects.create(
                        historial=historial,
                        motivo_consulta=motivo_match.group(1).strip(),
                        descripcion="Importado desde PDF",
                        tipo_consulta="presencial",
                    )
                    observaciones_creadas += 1
                except Exception as e:
                    logger.warning(f"Error al guardar observación: {str(e)}")

    logger.info(
        f"PDF procesado: {diagnosticos_creados} diagnósticos, "
        f"{recetas_creadas} recetas, {observaciones_creadas} observaciones, "
        f"{len(recetas_omitidas)} recetas omitidas"
    )

    return {
        "historial_id":          historial.id,
        "diagnosticos_creados":  diagnosticos_creados,
        "recetas_creadas":       recetas_creadas,
        "observaciones_creadas": observaciones_creadas,
        "recetas_omitidas":      recetas_omitidas,
    }
