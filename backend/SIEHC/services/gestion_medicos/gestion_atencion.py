from django.db import transaction
from django.utils import timezone

from citas.models import Cita
from historial.models import Historial, Diagnostico, Receta
from medicamentos.models import Medicamento, Despacho, DespachoItem
from facturacion.models import Facturacion
from usuarios.models import Medico, Paciente


# ─────────────────────────────────────────────────────────────────────────────
#  HELPERS INTERNOS
# ─────────────────────────────────────────────────────────────────────────────

def _obtener_historial(paciente: Paciente) -> Historial:
    """Devuelve el historial del paciente, creándolo si no existe."""
    historial, _ = Historial.objects.get_or_create(paciente=paciente)
    return historial


def _verificar_cita_del_medico(cita_id: int, medico: Medico) -> Cita:
    """
    Devuelve la cita solo si pertenece al médico y está en estado
    'confirmada' o 'en_curso'. Lanza PermissionError o ValueError si no.
    """
    try:
        cita = Cita.objects.select_related(
            "paciente__usuario", "medico__usuario", "medico__hospital"
        ).get(pk=cita_id)
    except Cita.DoesNotExist:
        raise ValueError("La cita no existe.")

    if cita.medico != medico:
        raise PermissionError("Esta cita no te pertenece.")

    if cita.estado not in ("confirmada", "en_curso"):
        raise ValueError(
            f"La cita está en estado '{cita.estado}'. "
            "Solo puedes atender citas confirmadas o en curso."
        )
    return cita


# ─────────────────────────────────────────────────────────────────────────────
#  HU09 — REGISTRAR DIAGNÓSTICO
# ─────────────────────────────────────────────────────────────────────────────

def registrar_diagnostico(medico: Medico, cita_id: int, datos: dict) -> Diagnostico:
    """
    Registra un diagnóstico en el historial del paciente de la cita.
    Si la cita estaba en 'confirmada', la avanza a 'en_curso'.

    Campos requeridos en `datos`:
        estado_clinico, categoria, severidad, ubicacion_anatomica,
        fecha_hora_inicio, edad_inicio, descripcion_inicio
    Campos opcionales:
        fecha_hora_reduccion, edad_reduccion, descripcion_reduccion, nota
    """
    cita      = _verificar_cita_del_medico(cita_id, medico)
    historial = _obtener_historial(cita.paciente)

    campos_requeridos = [
        "estado_clinico", "categoria", "severidad",
        "ubicacion_anatomica", "fecha_hora_inicio",
        "edad_inicio", "descripcion_inicio",
    ]
    for campo in campos_requeridos:
        if datos.get(campo) is None or datos.get(campo) == "":
            raise ValueError(f"El campo '{campo}' es obligatorio.")

    severidad = datos.get("severidad")
    if severidad not in dict(Diagnostico.SEVERIDAD_CHOICES):
        raise ValueError(f"Severidad inválida. Valores válidos: {', '.join(dict(Diagnostico.SEVERIDAD_CHOICES).keys())}.")

    with transaction.atomic():
        diagnostico = Diagnostico.objects.create(
            historial=historial,
            estado_clinico=datos["estado_clinico"],
            categoria=datos["categoria"],
            severidad=datos["severidad"],
            ubicacion_anatomica=datos["ubicacion_anatomica"],
            fecha_hora_inicio=datos["fecha_hora_inicio"],
            edad_inicio=datos["edad_inicio"],
            descripcion_inicio=datos["descripcion_inicio"],
            fecha_hora_reduccion=datos.get("fecha_hora_reduccion"),
            edad_reduccion=datos.get("edad_reduccion"),
            descripcion_reduccion=datos.get("descripcion_reduccion", ""),
            nota=datos.get("nota", ""),
        )

        if cita.estado == "confirmada":
            cita.estado = "en_curso"
            cita.save(update_fields=["estado"])

    return diagnostico


# ─────────────────────────────────────────────────────────────────────────────
#  HU10 — EMITIR RECETA
# ─────────────────────────────────────────────────────────────────────────────

def emitir_receta(medico: Medico, cita_id: int, datos: dict) -> Receta:
    """
    Emite una receta vinculada al historial del paciente de la cita.

    Campos requeridos en `datos`:
        medicamento (id), categoria, prioridad,
        instruccion_dosis, cantidad_suministrada
    Campos opcionales:
        intencion, periodo_dosis
    """
    cita      = _verificar_cita_del_medico(cita_id, medico)
    historial = _obtener_historial(cita.paciente)

    try:
        medicamento = Medicamento.objects.get(pk=datos.get("medicamento"), activo=True)
    except Medicamento.DoesNotExist:
        raise ValueError("El medicamento no existe o no está activo.")

    with transaction.atomic():
        receta = Receta.objects.create(
            historial=historial,
            medicamento=medicamento,
            intencion=datos.get("intencion", ""),
            categoria=datos["categoria"],
            prioridad=datos["prioridad"],
            instruccion_dosis=datos["instruccion_dosis"],
            periodo_dosis=datos.get("periodo_dosis", ""),
            cantidad_suministrada=datos["cantidad_suministrada"],
        )

    return receta


# ─────────────────────────────────────────────────────────────────────────────
#  HU11 — CATÁLOGO DE MEDICAMENTOS
# ─────────────────────────────────────────────────────────────────────────────

def catalogo_medicamentos(hospital_id=None, nombre: str = None, tipo: str = None):
    """
    Devuelve queryset paginable de medicamentos activos.
    Filtra por hospital (por defecto el del médico), nombre y tipo.
    """
    qs = Medicamento.objects.select_related("hospital").filter(activo=True)

    if hospital_id:
        qs = qs.filter(hospital_id=hospital_id)
    if nombre:
        qs = qs.filter(nombre__icontains=nombre)
    if tipo:
        qs = qs.filter(tipo=tipo)

    return qs.order_by("nombre")


# ─────────────────────────────────────────────────────────────────────────────
#  HU12 — DESPACHAR MEDICAMENTOS
# ─────────────────────────────────────────────────────────────────────────────

def despachar_medicamentos(medico: Medico, cita_id: int, items: list) -> dict:
    """
    Descuenta stock para cada ítem, crea un registro Despacho y devuelve un resumen.
    Usa select_for_update para evitar condición de carrera en el stock.

    `items` esperado (ya validados por DespachoInputSerializer):
        [ { "medicamento": <int>, "cantidad": <int> }, ... ]
    """
    cita = _verificar_cita_del_medico(cita_id, medico)

    if not items:
        raise ValueError("Debes indicar al menos un medicamento para despachar.")

    resumen = []
    despacho_items = []
    total_despacho = 0

    with transaction.atomic():
        # Crear el registro de Despacho
        despacho = Despacho.objects.create(medico=medico, cita=cita)

        for item in items:
            med_id   = item.get("medicamento")
            cantidad = item.get("cantidad", 1)

            try:
                med = Medicamento.objects.select_for_update().get(pk=med_id, activo=True)
            except Medicamento.DoesNotExist:
                raise ValueError(f"Medicamento id={med_id} no existe o no está activo.")

            if not med.hay_stock(cantidad):
                raise ValueError(
                    f"Stock insuficiente para '{med.nombre}'. "
                    f"Disponible: {med.stock}, solicitado: {cantidad}."
                )

            # Descontar stock
            med.stock -= cantidad
            med.save(update_fields=["stock"])

            # Crear DespachoItem
            despacho_item = DespachoItem.objects.create(
                despacho=despacho,
                medicamento=med,
                cantidad=cantidad,
                precio_unitario=med.costo
            )
            despacho_items.append(despacho_item)
            total_despacho += despacho_item.subtotal

            resumen.append({
                "medicamento_id":      med.id,
                "medicamento_nombre":  med.nombre,
                "cantidad_despachada": cantidad,
                "stock_restante":      med.stock,
                "precio_unitario":     float(med.costo),
                "subtotal":            float(despacho_item.subtotal),
            })

        # Actualizar el total del despacho
        despacho.total = total_despacho
        despacho.save(update_fields=["total"])

    return {
        "cita_id":  cita.id,
        "despacho_id": despacho.id,
        "paciente": cita.paciente.usuario.nombre,
        "total": float(total_despacho),
        "items": resumen,
    }


# ─────────────────────────────────────────────────────────────────────────────
#  HU13 — REGISTRAR PAGO
# ─────────────────────────────────────────────────────────────────────────────

def registrar_pago(medico: Medico, cita_id: int, datos: dict) -> Facturacion:
    """
    Registra el pago en efectivo del servicio médico.
    - Crea Facturacion con estado 'pagado'.
    - Marca la cita como 'completada'.
    - Lanza ValueError si la cita ya tiene factura.

    Campos requeridos en `datos`: monto_total
    Campo opcional: descripcion
    """
    cita = _verificar_cita_del_medico(cita_id, medico)

    if Facturacion.objects.filter(cita=cita).exists():
        raise ValueError("Esta cita ya tiene una factura registrada.")

    monto_total = datos.get("monto_total")
    if monto_total is None or float(monto_total) <= 0:
        raise ValueError("El monto total debe ser mayor a 0.")

    with transaction.atomic():
        factura = Facturacion.objects.create(
            cita=cita,
            descripcion=datos.get("descripcion", "Servicio médico"),
            monto_total=monto_total,
            estado_pago="pagado",
        )
        cita.estado = "completada"
        cita.save(update_fields=["estado"])

    return factura