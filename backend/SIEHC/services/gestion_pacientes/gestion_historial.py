from historial.models import Historial, Diagnostico, Receta, Observacion, Examen
from usuarios.models import Paciente


# ─────────────────────────────────────────────
#  CREAR O RECUPERAR HISTORIAL DEL PACIENTE
# ─────────────────────────────────────────────

def obtener_o_crear_historial(paciente: Paciente) -> tuple[Historial, bool]:
    """
    Retorna (historial, created).
    Si el paciente ya tiene historial lo devuelve; si no, lo crea.
    """
    return Historial.objects.get_or_create(paciente=paciente)


# ─────────────────────────────────────────────
#  SUBIR HISTORIAL: carga masiva desde el frontend
#  Recibe un dict con listas opcionales de
#  diagnosticos, recetas, observaciones, examenes
# ─────────────────────────────────────────────

def subir_historial(paciente: Paciente, datos: dict) -> dict:
    """
    Crea (o recupera) el historial del paciente y guarda
    los registros que vengan en `datos`.

    Estructura esperada de `datos`:
    {
        "diagnosticos": [ { ...campos Diagnostico... }, ... ],
        "recetas":      [ { ...campos Receta... }, ... ],
        "observaciones":[ { ...campos Observacion... }, ... ],
        "examenes":     [ { ...campos Examen... }, ... ],
    }

    Retorna un resumen con los conteos creados.
    """
    historial, _ = obtener_o_crear_historial(paciente)

    resumen = {
        "historial_id": historial.id,
        "diagnosticos_creados": 0,
        "recetas_creadas": 0,
        "observaciones_creadas": 0,
        "examenes_creados": 0,
    }

    # ── Diagnósticos ──────────────────────────
    for item in datos.get("diagnosticos", []):
        item["historial"] = historial.id          # inyectar FK
        from historial.serializers import DiagnosticoSerializer
        s = DiagnosticoSerializer(data=item)
        s.is_valid(raise_exception=True)
        s.save()
        resumen["diagnosticos_creados"] += 1

    # ── Recetas ───────────────────────────────
    for item in datos.get("recetas", []):
        item["historial"] = historial.id
        from historial.serializers import RecetaSerializer
        s = RecetaSerializer(data=item)
        s.is_valid(raise_exception=True)
        s.save()
        resumen["recetas_creadas"] += 1

    # ── Observaciones ─────────────────────────
    for item in datos.get("observaciones", []):
        item["historial"] = historial.id
        from historial.serializers import ObservacionSerializer
        s = ObservacionSerializer(data=item)
        s.is_valid(raise_exception=True)
        s.save()
        resumen["observaciones_creadas"] += 1

    # ── Exámenes ──────────────────────────────
    for item in datos.get("examenes", []):
        item["historial"] = historial.id
        from historial.serializers import ExamenSerializer
        s = ExamenSerializer(data=item)
        s.is_valid(raise_exception=True)
        s.save()
        resumen["examenes_creados"] += 1

    return resumen


# ─────────────────────────────────────────────
#  CONSULTAR: diagnósticos y recetas del paciente
#  ordenados por fecha descendente
# ─────────────────────────────────────────────

def obtener_diagnosticos(paciente: Paciente):
    """Retorna queryset de diagnósticos del paciente ordenados por fecha."""
    try:
        historial = paciente.historial
    except Historial.DoesNotExist:
        return Diagnostico.objects.none()
    return historial.diagnosticos.order_by("-fecha_hora_inicio")


def obtener_recetas(paciente: Paciente):
    """Retorna queryset de recetas del paciente ordenadas por fecha."""
    try:
        historial = paciente.historial
    except Historial.DoesNotExist:
        return Receta.objects.none()
    return historial.recetas.order_by("-fecha_emitida")