import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Plus, Clock, MapPin, X, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

// ── Helpers ────────────────────────────────────────────────────────────────

const extractList = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as any).results))
    return (data as any).results as T[];
  return [];
};

const formatDate = (v: string) => {
  try { return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(v)); }
  catch { return ""; }
};

const formatTime = (v: string) => {
  try { return new Intl.DateTimeFormat("es-PE", { hour: "2-digit", minute: "2-digit" }).format(new Date(v)); }
  catch { return ""; }
};

const parseError = (error: any): string => {
  if (!error) return "Ocurrió un error inesperado.";
  if (typeof error === "string") return error;
  if (Array.isArray(error)) return error.join(" ");
  if (typeof error === "object") {
    const first = Object.values(error)[0];
    return Array.isArray(first) ? first.join(" ") : error.error || error.detail || String(first) || "Ocurrió un error inesperado.";
  }
  return "Ocurrió un error inesperado.";
};

const formatAppointment = (cita: any): Appointment => ({
  id:        cita.id,
  date:      formatDate(cita.inicio),
  time:      formatTime(cita.inicio),
  doctor:    cita.medico_nombre   || cita.medico   || "Sin médico",
  specialty: cita.especialidad    || cita.medico_especialidad || "-",
  hospital:  cita.hospital_nombre || "-",
  status:    cita.estado_display  || cita.estado   || "-",
  rawStatus: (cita.estado || "").toLowerCase(),
});

// ── Tipos ──────────────────────────────────────────────────────────────────

type Appointment = {
  id: number; date: string; time: string; doctor: string;
  specialty: string; hospital: string; status: string; rawStatus: string;
};

type Hospital = { id: number; nombre: string };

type DoctorAvailable = {
  id: number; nombre: string; especialidad: string; periodo: string;
  ubicacion: string; hospital_id: number | null; hospital_nombre: string | null; disponibilidad: boolean;
};

// ── Constantes ─────────────────────────────────────────────────────────────

const statusStyles: Record<string, string> = {
  Confirmada: "bg-green-100 text-green-700 border-green-200",
  Pendiente:  "bg-yellow-100 text-yellow-700 border-yellow-200",
  "En curso": "bg-blue-100 text-blue-700 border-blue-200",
  Completada: "bg-secondary text-secondary-foreground",
  Cancelada:  "bg-destructive/10 text-destructive",
};

const filtros = [
  { key: "todas",      label: "Todas"      },
  { key: "pendiente",  label: "Pendiente"  },
  { key: "confirmada", label: "Confirmada" },
  { key: "completada", label: "Completada" },
  { key: "cancelada",  label: "Cancelada"  },
];

const FORM_INIT = {
  hospital: "", especialidad: "", medico: "", fecha: "",
  hora: "", tipo: "presencial", motivo: "", nota: "",
};

// ── Componente principal ────────────────────────────────────────────────────

const PatientCitas = () => {
  const [appointments,   setAppointments]   = useState<Appointment[]>([]);
  const [filter,         setFilter]         = useState("todas");
  const [hospitals,      setHospitals]      = useState<Hospital[]>([]);
  const [doctors,        setDoctors]        = useState<DoctorAvailable[]>([]);
  const [isModalOpen,    setIsModalOpen]    = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);
  const [hospitalsError,   setHospitalsError]   = useState("");
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [formLoading,    setFormLoading]    = useState(false);
  const [cancelLoading,  setCancelLoading]  = useState<number | null>(null);
  const [pageError,      setPageError]      = useState("");
  const [formError,      setFormError]      = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Formulario consolidado
  const [form, setForm] = useState(FORM_INIT);
  const setF = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));
  const resetForm = () => { setForm(FORM_INIT); setFormError(""); setDoctors([]); };

  // Derivados
  const especialidades = useMemo(
    () => [...new Set(doctors.map((d) => d.especialidad).filter(Boolean))].sort(),
    [doctors]
  );

  const medicosFiltrados = useMemo(
    () => form.especialidad ? doctors.filter((d) => d.especialidad === form.especialidad) : doctors,
    [doctors, form.especialidad]
  );

  const filteredAppointments = useMemo(
    () => filter === "todas" ? appointments : appointments.filter((a) => a.rawStatus === filter),
    [appointments, filter]
  );

  // ── Carga inicial ─────────────────────────────────────────────────────────

  useEffect(() => {
    const loadHospitals = async () => {
      setHospitalsLoading(true);
      try {
        setHospitals(extractList<Hospital>(await api("/hospitales/hospitales/")));
      } catch {
        setHospitalsError("No se pudieron cargar los hospitales.");
      } finally {
        setHospitalsLoading(false);
      }
    };

    const loadAppointments = async () => {
      setLoading(true);
      try {
        setAppointments(extractList<any>(await api("/citas/mis-citas/")).map(formatAppointment));
      } catch (error) {
        setPageError(parseError(error));
      } finally {
        setLoading(false);
      }
    };

    loadHospitals();
    loadAppointments();
  }, []);

  // Carga médicos al cambiar hospital
  useEffect(() => {
    if (!isModalOpen || !form.hospital) {
      setDoctors([]);
      setForm((p) => ({ ...p, especialidad: "", medico: "" }));
      return;
    }
    const loadDoctors = async () => {
      setDoctorsLoading(true);
      setFormError("");
      try {
        setDoctors(extractList<DoctorAvailable>(
          await api(`/citas/medicos-disponibles/?hospital=${form.hospital}`)
        ));
        setForm((p) => ({ ...p, especialidad: "", medico: "" }));
      } catch (error) {
        setFormError(parseError(error));
      } finally {
        setDoctorsLoading(false);
      }
    };
    loadDoctors();
  }, [form.hospital, isModalOpen]);

  // Resetear médico al cambiar especialidad
  useEffect(() => { setF("medico", ""); }, [form.especialidad]);

  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) resetForm();
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

const handleSubmit = async () => {
  setFormError("");

  if (!form.hospital || !form.especialidad || !form.medico || !form.fecha || !form.hora || !form.motivo) {
    setFormError("Completa todos los campos obligatorios antes de solicitar la cita.");
    return;
  }

  // Fecha no puede ser pasada
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaSeleccionada = new Date(form.fecha);
  if (fechaSeleccionada < hoy) {
    setFormError("La fecha de la cita no puede ser en el pasado.");
    return;
  }

  // Hora en rango laboral (7:00 - 20:00)
  const [horas, minutos] = form.hora.split(":").map(Number);
  if (horas < 7 || horas >= 20) {
    setFormError("La hora debe estar entre 7:00 am y 8:00 pm.");
    return;
  }

  // Motivo mínimo de caracteres
  if (form.motivo.trim().length < 5) {
    setFormError("El motivo de consulta debe tener al menos 5 caracteres.");
    return;
  }

  const inicio = new Date(`${form.fecha}T${form.hora}`);
  if (Number.isNaN(inicio.getTime())) { setFormError("La fecha o la hora no son válidas."); return; }

    const medicoObj = doctors.find((d) => String(d.id) === form.medico);
    const fin = new Date(inicio.getTime() + 30 * 60 * 1000);

    setFormLoading(true);
    try {
      const response = await api("/citas/solicitar/", {
        method: "POST",
        body: JSON.stringify({
          hospital:           Number(form.hospital),
          medico:             Number(form.medico),
          tipo:               form.tipo,
          categoria_servicio: medicoObj?.especialidad ?? form.especialidad,
          especialidad:       medicoObj?.especialidad ?? form.especialidad,
          prioridad:          "normal",
          inicio:             inicio.toISOString(),
          fin:                fin.toISOString(),
          nota:               form.motivo + (form.nota ? `\n\n${form.nota}` : ""),
          costo_servicio:     0,
        }),
      });
      setAppointments((current) => [formatAppointment(response.cita), ...current]);
      setSuccessMessage("Cita solicitada correctamente.");
      setTimeout(() => setSuccessMessage(""), 4000);
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      setFormError(parseError(error));
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = async (appointmentId: number) => {
    if (!window.confirm("¿Quieres cancelar esta cita?")) return;
    setCancelLoading(appointmentId);
    try {
      const response = await api(`/citas/${appointmentId}/cancelar/`, { method: "PATCH" });
      setAppointments((current) =>
        current.map((item) => item.id === appointmentId ? formatAppointment(response.cita) : item)
      );
      setSuccessMessage("Cita cancelada correctamente.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error) {
      setPageError(parseError(error));
    } finally {
      setCancelLoading(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Citas Médicas</h1>
          <p className="text-muted-foreground mt-1">Solicita, consulta y gestiona tus citas.</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />Solicitar Cita</Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Solicitar Nueva Cita</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">

              {/* Hospital */}
              <div className="space-y-1.5">
                <Label htmlFor="hospital">Hospital <span className="text-destructive">*</span></Label>
                <Select value={form.hospital} onValueChange={(v) => setF("hospital", v)}
                  disabled={formLoading || hospitalsLoading || !!hospitalsError}>
                  <SelectTrigger id="hospital">
                    <SelectValue placeholder={
                      hospitalsLoading ? "Cargando hospitales…"
                      : hospitalsError ? "Error al cargar hospitales"
                      : hospitals.length === 0 ? "No hay hospitales disponibles"
                      : "Seleccionar hospital"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {hospitals.map((h) => <SelectItem key={h.id} value={String(h.id)}>{h.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
                {hospitalsError && <p className="text-xs text-destructive mt-1">{hospitalsError}</p>}
              </div>

              {/* Especialidad */}
              <div className="space-y-1.5">
                <Label htmlFor="especialidad">Especialidad <span className="text-destructive">*</span></Label>
                <Select value={form.especialidad} onValueChange={(v) => setF("especialidad", v)}
                  disabled={formLoading || doctorsLoading || !form.hospital}>
                  <SelectTrigger id="especialidad">
                    <SelectValue placeholder={
                      doctorsLoading ? "Cargando especialidades…"
                      : !form.hospital ? "Selecciona un hospital primero"
                      : especialidades.length === 0 ? "No hay especialidades disponibles"
                      : "Seleccionar especialidad"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {especialidades.map((esp) => <SelectItem key={esp} value={esp}>{esp}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Médico */}
              <div className="space-y-1.5">
                <Label htmlFor="medico">Médico <span className="text-destructive">*</span></Label>
                <Select value={form.medico} onValueChange={(v) => setF("medico", v)}
                  disabled={formLoading || doctorsLoading || !form.especialidad || medicosFiltrados.length === 0}>
                  <SelectTrigger id="medico">
                    <SelectValue placeholder={
                      doctorsLoading ? "Cargando médicos…"
                      : !form.especialidad ? "Selecciona una especialidad primero"
                      : medicosFiltrados.length === 0 ? "No hay médicos disponibles"
                      : "Seleccionar médico"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {medicosFiltrados.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>{m.nombre} — {m.periodo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fecha y Hora */}
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { id: "fecha", label: "Fecha", type: "date", min: new Date().toISOString().split("T")[0] },
                  { id: "hora",  label: "Hora",  type: "time" },
                ].map(({ id, label, type, min }) => (
                  <div key={id} className="space-y-1.5">
                    <Label htmlFor={id}>{label} <span className="text-destructive">*</span></Label>
                    <Input id={id} type={type} min={min} disabled={formLoading}
                      value={(form as any)[id]} onChange={(e) => setF(id, e.target.value)} />
                  </div>
                ))}
              </div>

              {/* Tipo */}
              <div className="space-y-1.5">
                <Label htmlFor="tipo">Tipo de consulta</Label>
                <Select value={form.tipo} onValueChange={(v) => setF("tipo", v)} disabled={formLoading}>
                  <SelectTrigger id="tipo"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="virtual">Virtual</SelectItem>
                    <SelectItem value="emergencia">Emergencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Motivo */}
              <div className="space-y-1.5">
                <Label htmlFor="motivo">Motivo de consulta <span className="text-destructive">*</span></Label>
                <Input id="motivo" placeholder="Ej: Dolor de cabeza frecuente, control anual…"
                  value={form.motivo} onChange={(e) => setF("motivo", e.target.value)} disabled={formLoading} />
              </div>

              {/* Notas */}
              <div className="space-y-1.5">
                <Label htmlFor="nota">Notas adicionales <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                <Textarea id="nota" rows={3} placeholder="Agrega información adicional para el médico…"
                  value={form.nota} onChange={(e) => setF("nota", e.target.value)} disabled={formLoading} />
              </div>

              {/* Error */}
              {formError && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{formError}</span>
                </div>
              )}

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-2">
                <DialogClose asChild>
                  <Button variant="outline" disabled={formLoading} type="button">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleSubmit} disabled={formLoading} className="gap-2 min-w-[140px]" type="button">
                  {formLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando…</>
                    : <><Plus className="w-4 h-4" />Confirmar cita</>
                  }
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mensajes globales */}
      {successMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {successMessage}
        </div>
      )}
      {pageError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {pageError}
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {filtros.map(({ key, label }) => (
          <Button key={key} variant={filter === key ? "default" : "outline"} size="sm" onClick={() => setFilter(key)}>
            {label}
          </Button>
        ))}
      </div>

      {/* Lista de citas */}
      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando tus citas…</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => (
            <Card key={apt.id} className="border-border hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="w-6 h-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground">{apt.doctor} — {apt.specialty}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{apt.date} a las {apt.time}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{apt.hospital}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={statusStyles[apt.status] ?? "bg-muted text-muted-foreground"}>{apt.status}</Badge>
                    {(apt.rawStatus === "confirmada" || apt.rawStatus === "pendiente") && (
                      <Button variant="ghost" size="sm" onClick={() => handleCancel(apt.id)}
                        disabled={cancelLoading === apt.id}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1">
                        {cancelLoading === apt.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <X className="w-4 h-4" />}
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredAppointments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <CalendarDays className="w-7 h-7 text-primary/50" />
              </div>
              <p className="text-muted-foreground font-medium">No hay citas con este estado</p>
              <p className="text-sm text-muted-foreground mt-1">
                {filter === "todas"
                  ? "Solicita tu primera cita con el botón de arriba."
                  : `No tienes citas en estado "${filter}".`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientCitas;