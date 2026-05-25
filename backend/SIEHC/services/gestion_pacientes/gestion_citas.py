from django.utils import timezone
from django.db import transaction
from django.utils.dateparse import parse_datetime
from citas.models import Cita
from usuarios.models import Paciente, Medico


# ─────────────────────────────────────────────────────────────────────────────
#  HU06 — SOLICITAR CITA
# ─────────────────────────────────────────────────────────────────────────────

def solicitar_cita(paciente: Paciente, datos: dict) -> Cita:
    medico_id   = datos.get("medico")
    hospital_id = datos.get("hospital")
    inicio_raw  = datos.get("inicio")
    fin_raw     = datos.get("fin")

    # ── Parsear strings a datetime con timezone ───────────────────────────────
    inicio = parse_datetime(inicio_raw) if isinstance(inicio_raw, str) else inicio_raw
    fin    = parse_datetime(fin_raw)    if isinstance(fin_raw,    str) else fin_raw

    if inicio is None or fin is None:
        raise ValueError("El formato de fecha/hora no es válido. Usa ISO 8601.")

    # Asegurar que sean aware (con timezone) para comparar con timezone.now()
    if timezone.is_naive(inicio):
        inicio = timezone.make_aware(inicio)
    if timezone.is_naive(fin):
        fin = timezone.make_aware(fin)

    # ── 1. Médico existe y está disponible ────────────────────────────────────
    try:
        medico = Medico.objects.select_related("usuario", "hospital").get(pk=medico_id)
    except Medico.DoesNotExist:
        raise ValueError("El médico indicado no existe.")

    if not medico.disponibilidad:
        raise ValueError("El médico no está disponible en este momento.")

    # ── 2. El médico pertenece al hospital indicado ───────────────────────────
    if hospital_id and medico.hospital_id != int(hospital_id):
        raise ValueError("El médico no pertenece al hospital indicado.")

    # ── 3. Fecha de inicio futura ─────────────────────────────────────────────
    if timezone.now() > inicio:
        raise ValueError("La fecha de inicio debe ser en el futuro.")

    # ── 4. Sin solapamiento para el médico ────────────────────────────────────
    solapamiento = Cita.objects.filter(
        medico=medico,
        estado__in=["pendiente", "confirmada", "en_curso"],
        inicio__lt=fin,
        fin__gt=inicio,
    ).exists()

    if solapamiento:
        raise ValueError(
            "El médico ya tiene una cita en ese horario. "
            "Por favor elige otro horario."
        )

    # ── 5. Crear la cita ──────────────────────────────────────────────────────
    with transaction.atomic():
        cita = Cita.objects.create(
            paciente=paciente,
            medico=medico,
            tipo=datos.get("tipo", "presencial"),
            categoria_servicio=datos.get("categoria_servicio", ""),
            especialidad=datos.get("especialidad", medico.especialidad),
            prioridad=datos.get("prioridad", "normal"),
            estado="pendiente",
            inicio=inicio,
            fin=fin,
            nota=datos.get("nota", ""),
            costo_servicio=datos.get("costo_servicio", 0),
        )

    return cita


# ─────────────────────────────────────────────────────────────────────────────
#  HU07 — CANCELAR CITA (paciente)
# ─────────────────────────────────────────────────────────────────────────────

def cancelar_cita(cita: Cita, solicitante) -> Cita:
    """
    Cancela una cita.
    - El paciente solo puede cancelar sus propias citas.
    - No se puede cancelar una cita ya completada o ya cancelada.
    """
    # Verificar propiedad si es paciente
    if hasattr(solicitante, "paciente") and cita.paciente != solicitante.paciente:
        raise PermissionError("No puedes cancelar una cita que no te pertenece.")

    if cita.estado in ("completada", "cancelada"):
        raise ValueError(
            f"La cita ya está en estado '{cita.estado}' y no puede cancelarse."
        )

    cita.estado = "cancelada"
    cita.fecha_cancelacion = timezone.now()
    cita.save(update_fields=["estado", "fecha_cancelacion"])
    return cita


# ─────────────────────────────────────────────────────────────────────────────
#  HU08 — CAMBIAR ESTADO DE CITA (médico / admin)
# ─────────────────────────────────────────────────────────────────────────────

TRANSICIONES_VALIDAS = {
    "pendiente":  ["confirmada", "cancelada"],
    "confirmada": ["en_curso",   "cancelada"],
    "en_curso":   ["completada", "cancelada"],
    "completada": [],
    "cancelada":  [],
}


def cambiar_estado_cita(cita: Cita, nuevo_estado: str, solicitante) -> Cita:
    """
    Avanza el estado de la cita siguiendo el flujo permitido.
    Solo médicos (sobre sus propias citas) o admins pueden usar esto.
    """
    # Verificar propiedad si es médico
    if hasattr(solicitante, "medico") and cita.medico != solicitante.medico:
        raise PermissionError("No puedes modificar una cita que no es tuya.")

    estados_permitidos = TRANSICIONES_VALIDAS.get(cita.estado, [])
    if nuevo_estado not in estados_permitidos:
        raise ValueError(
            f"No se puede pasar de '{cita.estado}' a '{nuevo_estado}'. "
            f"Transiciones válidas: {estados_permitidos or 'ninguna'}."
        )

    # Actualizar estado
    cita.estado = nuevo_estado
    
    # Si es cancelada, registrar fecha de cancelación
    if nuevo_estado == "cancelada":
        cita.fecha_cancelacion = timezone.now()
        cita.save(update_fields=["estado", "fecha_cancelacion"])
    else:
        cita.save(update_fields=["estado"])

    return cita


# ─────────────────────────────────────────────────────────────────────────────
#  CONSULTAS
# ─────────────────────────────────────────────────────────────────────────────

def citas_del_paciente(paciente: Paciente, estado: str = None):
    """
    HU07 — Listado de citas activas e históricas del paciente.
    Si se pasa `estado`, filtra por ese estado.
    """
    qs = Cita.objects.filter(paciente=paciente).select_related(
        "medico__usuario", "medico__hospital"
    ).order_by("-inicio")

    if estado:
        qs = qs.filter(estado=estado)

    return qs


def citas_del_medico(medico: Medico, estado: str = None):
    """
    HU08 — Lista de citas del médico ordenadas por hora de inicio.
    """
    qs = Cita.objects.filter(medico=medico).select_related(
        "paciente__usuario"
    ).order_by("inicio")

    if estado:
        qs = qs.filter(estado=estado)

    return qs


def medicos_disponibles(hospital_id: int = None, especialidad: str = None):
    """
    HU06 — Lista médicos disponibles, opcionalmente filtrando
    por hospital y/o especialidad.
    """
    qs = Medico.objects.filter(disponibilidad=True).select_related(
        "usuario", "hospital"
    )

    if hospital_id:
        qs = qs.filter(hospital_id=hospital_id)

    if especialidad:
        qs = qs.filter(especialidad__icontains=especialidad)

    return qs