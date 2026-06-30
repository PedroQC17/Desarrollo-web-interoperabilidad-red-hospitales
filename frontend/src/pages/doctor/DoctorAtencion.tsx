import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Check, Loader2, AlertCircle, Pill, ShoppingCart,
  ArrowRight, ArrowLeft, Plus, Trash2, CheckCircle2,
  ChevronRight, FileText, Landmark, CalendarDays, Clock, MapPin, Stethoscope, Download
} from "lucide-react";
import config from "@/config/env";

// ── Tipos ──────────────────────────────────────────────────────────────────

interface Cita {
  id: number;
  paciente: number;
  paciente_nombre: string;
  especialidad: string;
  categoria_servicio: string;
  hospital_nombre: string;
  estado: string;
  estado_display: string;
  inicio: string;
  fin: string;
  costo_servicio: string | number;
}

interface Medicamento {
  id: number;
  nombre: string;
  costo: string | number;
  stock: number;
  tipo: string;
}

interface Receta {
  id: number;
  medicamento: number;
  medicamento_nombre: string;
  medicamento_costo: number;
  intencion: string;
  categoria: string;
  prioridad: string;
  instruccion_dosis: string;
  periodo_dosis: string;
  cantidad_suministrada: number;
}

interface ResumenPago {
  cita_id: number;
  paciente: string;
  especialidad: string;
  costo_consulta: number;
  medicamentos: Array<{ medicamento: string; cantidad: number; costo_unit: number; subtotal: number }>;
  costo_medicamentos: number;
  monto_total: number;
}

// ── Constantes ─────────────────────────────────────────────────────────────

const STEPS = [
  { number: 1, title: "Observación", desc: "Anamnesis" },
  { number: 2, title: "Diagnóstico", desc: "Clasificación clínica" },
  { number: 3, title: "Recetas", desc: "Opcional" },
  { number: 4, title: "Despacho", desc: "Opcional" },
  { number: 5, title: "Facturación", desc: "Finalizar atención" },
];

const DIAG_INIT = {
  estado_clinico: "", categoria: "", severidad: "leve", ubicacion_anatomica: "",
  fecha_hora_inicio: new Date().toISOString().slice(0, 16),
  edad_inicio: "", descripcion_inicio: "", nota: "",
  fecha_hora_reduccion: "", edad_reduccion: "", descripcion_reduccion: "",
};

const RECETA_INIT = {
  medicamentoId: "", intencion: "", categoria: "libre", prioridad: "media",
  instruccion_dosis: "", periodo_dosis: "", cantidad_suministrada: "",
};

// ── Subcomponentes ─────────────────────────────────────────────────────────

const ErrorBanner = ({ msg, onDismiss }: { msg: string; onDismiss: () => void }) => (
  <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-xl text-sm flex items-start gap-2.5 animate-in slide-in-from-top-2 duration-300">
    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
    <div className="flex-1 font-medium">{msg}</div>
    <button onClick={onDismiss} className="text-xs underline ml-2 hover:opacity-85">Ignorar</button>
  </div>
);

const SubmitBtn = ({ submitting, label, icon: Icon = ChevronRight }: { submitting: boolean; label: string; icon?: React.ElementType }) => (
  <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700 text-white px-6">
    {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
    {label}
    <Icon className="w-4 h-4 ml-1" />
  </Button>
);

const NavButtons = ({
  onBack, onNext, submitting, nextLabel = "Siguiente", showSkip = false, onSkip,
}: {
  onBack: () => void; onNext?: () => void; submitting?: boolean;
  nextLabel?: string; showSkip?: boolean; onSkip?: () => void;
}) => (
  <Card className="border-border shadow-sm p-4">
    <div className="flex justify-between items-center gap-3">
      <Button variant="outline" type="button" onClick={onBack}>Atrás</Button>
      <div className="flex gap-2">
        {showSkip && (
          <Button variant="ghost" type="button" onClick={onSkip} className="text-muted-foreground hover:text-foreground">
            Omitir
          </Button>
        )}
        {onNext && (
          <Button type="button" onClick={onNext} disabled={submitting} className="bg-teal-600 hover:bg-teal-700 text-white px-6 gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {nextLabel} <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  </Card>
);

// ── Componente principal ────────────────────────────────────────────────────

export default function DoctorAtencion() {
  const { citaId } = useParams<{ citaId: string }>();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [loadingCita, setLoadingCita] = useState(true);
  const [cita, setCita] = useState<Cita | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successEnd, setSuccessEnd] = useState(false);

  // Step 1
  const [motivoConsulta, setMotivoConsulta] = useState("");
  const [antecedentesPatologicos, setAntecedentesPatologicos] = useState("");

  // Step 2
  const [diagnosticoForm, setDiagnosticoForm] = useState(DIAG_INIT);
  const setDiag = (field: string, value: string) =>
    setDiagnosticoForm((prev) => ({ ...prev, [field]: value }));

  // Step 3
  const [medicamentosCatalogo, setMedicamentosCatalogo] = useState<Medicamento[]>([]);
  const [recetasForm, setRecetasForm] = useState(RECETA_INIT);
  const setReceta = (field: string, value: string) =>
    setRecetasForm((prev) => ({ ...prev, [field]: value }));
  const [recetasEmitidas, setRecetasEmitidas] = useState<Receta[]>([]);
  const [loadingRecetas, setLoadingRecetas] = useState(false);

  // Step 4
  const [despachoCart, setDespachoCart] = useState<Array<{ id: number; nombre: string; cantidad: number; stock: number }>>([]);
  const [searchMed, setSearchMed] = useState("");

  // Step 5
  const [resumenPago, setResumenPago] = useState<ResumenPago | null>(null);
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [montoTotal, setMontoTotal] = useState("");
  const [descripcionPago, setDescripcionPago] = useState("");

  // ── Fetches ───────────────────────────────────────────────────────────────

  const fetchCitaDetalle = async () => {
    setLoadingCita(true);
    setErrorMsg(null);
    try {
      const res = await api(`/citas/${citaId}/detalle/`);
      setCita(res);
      setDiag("fecha_hora_inicio", new Date().toISOString().slice(0, 16));
    } catch (err: any) {
      setErrorMsg(err?.error || "Error al cargar los detalles de la cita.");
    } finally {
      setLoadingCita(false);
    }
  };

  const fetchCatalog = async () => {
    try {
      const res = await api("/medicamentos/catalogo/");
      const data = res?.results ?? res;
      setMedicamentosCatalogo(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar medicamentos:", err);
    }
  };

  const fetchRecetas = async () => {
    setLoadingRecetas(true);
    try {
      const res = await api(`/citas/${citaId}/receta/`);
      setRecetasEmitidas(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRecetas(false);
    }
  };

  const fetchResumenPago = async () => {
    setLoadingResumen(true);
    try {
      const res = await api(`/citas/${citaId}/resumen-pago/`);
      setResumenPago(res);
      setMontoTotal(Number(res?.monto_total || 0).toFixed(2));
      setDescripcionPago(`Atención médica - ${res?.especialidad || ""}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingResumen(false);
    }
  };

  const descargarPDF = async (recetaId: number) => {
    const token = localStorage.getItem("access");
    try {
      const res = await fetch(`${config.api.baseUrl}/recetas/${recetaId}/pdf/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receta_${recetaId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
  };

  useEffect(() => { if (citaId) fetchCitaDetalle(); }, [citaId]);

  useEffect(() => {
    if (currentStep === 3 || currentStep === 4) fetchCatalog();
    if (currentStep === 3) fetchRecetas();
    if (currentStep === 5) fetchResumenPago();
  }, [currentStep]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const withSubmit = async (fn: () => Promise<void>) => {
    setErrorMsg(null);
    setSubmitting(true);
    try { await fn(); } catch (err: any) {
      setErrorMsg(err?.error || "Ha ocurrido un error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivoConsulta.trim()) { setErrorMsg("El motivo de consulta es obligatorio."); return; }
    withSubmit(async () => {
      await api("/historiales/subir/", {
        method: "POST",
        body: JSON.stringify({
          paciente: cita?.paciente,
          observaciones: [{ motivo_consulta: motivoConsulta, antecedentes_patologicos: antecedentesPatologicos }],
        }),
      });
      setCurrentStep(2);
    });
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const { estado_clinico, categoria, severidad, ubicacion_anatomica, fecha_hora_inicio, edad_inicio, descripcion_inicio } = diagnosticoForm;
    if (!estado_clinico || !categoria || !severidad || !ubicacion_anatomica || !fecha_hora_inicio || !edad_inicio || !descripcion_inicio) {
      setErrorMsg("Todos los campos obligatorios deben estar llenos.");
      return;
    }
    withSubmit(async () => {
      await api(`/citas/${citaId}/diagnostico/`, {
        method: "POST",
        body: JSON.stringify({
          ...diagnosticoForm,
          fecha_hora_inicio: new Date(fecha_hora_inicio).toISOString(),
          edad_inicio: parseInt(edad_inicio),
          fecha_hora_reduccion: diagnosticoForm.fecha_hora_reduccion
            ? new Date(diagnosticoForm.fecha_hora_reduccion).toISOString() : null,
          edad_reduccion: diagnosticoForm.edad_reduccion ? parseInt(diagnosticoForm.edad_reduccion) : null,
        }),
      });
      setCurrentStep(3);
    });
  };

  const handleAddReceta = (e: React.FormEvent) => {
    e.preventDefault();
    const { medicamentoId, intencion, categoria, prioridad, instruccion_dosis, periodo_dosis, cantidad_suministrada } = recetasForm;
    if (!medicamentoId || !intencion || !instruccion_dosis || !periodo_dosis || !cantidad_suministrada) {
      setErrorMsg("Por favor, rellene todos los campos de la receta.");
      return;
    }
    withSubmit(async () => {
      await api(`/citas/${citaId}/receta/`, {
        method: "POST",
        body: JSON.stringify({
          medicamento: parseInt(medicamentoId),
          intencion, categoria, prioridad, instruccion_dosis, periodo_dosis,
          cantidad_suministrada: parseInt(cantidad_suministrada),
        }),
      });
      setRecetasForm(RECETA_INIT);
      fetchRecetas();
    });
  };

  const handleDespacho = () => {
    if (despachoCart.length === 0) { setErrorMsg("Debe agregar al menos un medicamento."); return; }
    withSubmit(async () => {
      await api(`/medicamentos/despachar/${citaId}/`, {
        method: "POST",
        body: JSON.stringify({ items: despachoCart.map(({ id, cantidad }) => ({ medicamento: id, cantidad })) }),
      });
      setCurrentStep(5);
    });
  };

  const handleFinalizeAttention = (e: React.FormEvent) => {
    e.preventDefault();
    if (!montoTotal || parseFloat(montoTotal) <= 0) { setErrorMsg("El monto total debe ser mayor a 0."); return; }
    withSubmit(async () => {
      await api(`/citas/${citaId}/pagar/`, {
        method: "POST",
        body: JSON.stringify({ monto_total: parseFloat(montoTotal), descripcion: descripcionPago || "Servicio médico" }),
      });
      setSuccessEnd(true);
    });
  };

  // ── Carrito despacho ──────────────────────────────────────────────────────

  const addToDespachoCart = (med: Medicamento) => {
    setDespachoCart((prev) => {
      const existing = prev.find((i) => i.id === med.id);
      if (existing) {
        if (existing.cantidad >= med.stock) { alert(`Stock máximo disponible: ${med.stock}`); return prev; }
        return prev.map((i) => i.id === med.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...prev, { id: med.id, nombre: med.nombre, cantidad: 1, stock: med.stock }];
    });
  };

  const updateCartQty = (id: number, val: number) =>
    setDespachoCart((prev) =>
      prev.map((i) => i.id === id ? { ...i, cantidad: Math.max(1, Math.min(i.stock, val)) } : i)
    );

  const removeFromDespachoCart = (id: number) =>
    setDespachoCart((prev) => prev.filter((i) => i.id !== id));

  const filteredMeds = medicamentosCatalogo.filter((m) =>
    m.nombre.toLowerCase().includes(searchMed.toLowerCase())
  );

  // ── Renders especiales ────────────────────────────────────────────────────

  if (loadingCita) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm font-medium">Cargando datos de la cita y paciente...</p>
      </div>
    );
  }

  if (successEnd) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 max-w-lg mx-auto text-center space-y-8 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/5">
          <Check className="w-10 h-10" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground">¡Atención Completada!</h1>
          <p className="text-muted-foreground">
            La atención médica para <strong>{cita?.paciente_nombre}</strong> ha sido registrada exitosamente.
          </p>
        </div>
        <Card className="w-full border-border bg-card/50">
          <CardContent className="p-6 text-left space-y-3 text-sm">
            {[
              ["Cita ID", cita?.id],
              ["Paciente", cita?.paciente_nombre],
              ["Especialidad", cita?.especialidad],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">{label}:</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
            <div className="flex justify-between pt-1">
              <span className="text-muted-foreground font-medium">Importe Total Facturado:</span>
              <span className="font-bold text-emerald-600">S/ {parseFloat(montoTotal).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
        <Button onClick={() => navigate("/medico/citas")} className="w-full gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium py-6 rounded-xl">
          Volver a Citas Pendientes <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // ── Render principal ──────────────────────────────────────────────────────

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-1">

      {/* Banner superior */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-teal-500/10 via-primary/5 to-transparent p-6 rounded-2xl border border-teal-500/20">
        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 rounded-xl bg-teal-600/10 text-teal-600 flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Módulo de Atención Médica</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Paciente: <span className="font-semibold text-foreground">{cita?.paciente_nombre}</span> • Cita #{cita?.id}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{cita ? new Date(cita.inicio).toLocaleDateString() : ""}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{cita ? new Date(cita.inicio).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
              {cita?.hospital_nombre && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{cita.hospital_nombre}</span>}
              <Badge variant="secondary" className="bg-teal-500/10 text-teal-700 hover:bg-teal-500/20 border-none">{cita?.especialidad}</Badge>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/medico/citas")} className="self-start md:self-auto gap-1 border-border">
          <ArrowLeft className="w-4 h-4" /> Salir de la atención
        </Button>
      </div>

      {/* Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 border-b border-border pb-6">
        {STEPS.map((s) => {
          const isActive = s.number === currentStep;
          const isCompleted = s.number < currentStep;
          return (
            <div key={s.number} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              isActive ? "bg-primary/5 border-primary text-foreground"
              : isCompleted ? "bg-emerald-500/5 border-emerald-500/20 text-muted-foreground"
              : "bg-background border-border text-muted-foreground"}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                isActive ? "bg-teal-600 text-white"
                : isCompleted ? "bg-emerald-500 text-white"
                : "bg-muted text-muted-foreground border border-border"}`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : s.number}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold leading-tight">{s.title}</p>
                <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {errorMsg && <ErrorBanner msg={errorMsg} onDismiss={() => setErrorMsg(null)} />}

      {/* Pasos */}
      <div className="space-y-6">

        {/* PASO 1 */}
        {currentStep === 1 && (
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><FileText className="w-5 h-5 text-primary" />Paso 1 — Observación y Anamnesis</CardTitle>
              <CardDescription>Registre los antecedentes patológicos del paciente y el motivo de consulta.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStep1Submit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="motivoConsulta">Motivo de Consulta <span className="text-destructive">*</span></Label>
                  <Textarea id="motivoConsulta" placeholder="Describa el motivo de la consulta..." value={motivoConsulta}
                    onChange={(e) => setMotivoConsulta(e.target.value)} rows={4} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="antecedentes">Antecedentes Patológicos</Label>
                  <Textarea id="antecedentes" placeholder="Alergias, operaciones previas, antecedentes familiares..." value={antecedentesPatologicos}
                    onChange={(e) => setAntecedentesPatologicos(e.target.value)} rows={4} />
                </div>
                <div className="flex justify-end pt-3">
                  <SubmitBtn submitting={submitting} label="Siguiente: Diagnóstico" />
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* PASO 2 */}
        {currentStep === 2 && (
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Stethoscope className="w-5 h-5 text-primary" />Paso 2 — Diagnóstico Clínico</CardTitle>
              <CardDescription>Llene el diagnóstico médico principal del paciente.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStep2Submit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: "estado_clinico", label: "Estado Clínico", placeholder: "Ej: Faringitis Aguda", required: true },
                    { id: "categoria", label: "Categoría de Diagnóstico", placeholder: "Ej: Infecciones, Cardiovascular", required: true },
                    { id: "ubicacion_anatomica", label: "Ubicación Anatómica", placeholder: "Ej: Garganta, Sistema Cardiovascular", required: true },
                    { id: "edad_inicio", label: "Edad de Inicio (Años)", placeholder: "Ej: 30", required: true, type: "number" },
                    { id: "fecha_hora_inicio", label: "Fecha y Hora de Inicio", required: true, type: "datetime-local" },
                  ].map(({ id, label, placeholder, required, type = "text" }) => (
                    <div key={id} className="space-y-2">
                      <Label htmlFor={id}>{label} {required && <span className="text-destructive">*</span>}</Label>
                      <Input id={id} type={type} placeholder={placeholder}
                        value={(diagnosticoForm as any)[id]} required={required} min={type === "number" ? "0" : undefined}
                        onChange={(e) => setDiag(id, e.target.value)} />
                    </div>
                  ))}
                  <div className="space-y-2">
                    <Label htmlFor="severidad">Severidad <span className="text-destructive">*</span></Label>
                    <Select value={diagnosticoForm.severidad} onValueChange={(v) => setDiag("severidad", v)}>
                      <SelectTrigger id="severidad"><SelectValue placeholder="Seleccione severidad" /></SelectTrigger>
                      <SelectContent>
                        {["leve", "moderado", "grave", "critico"].map((v) => (
                          <SelectItem key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {[
                  { id: "descripcion_inicio", label: "Descripción del Inicio", required: true, placeholder: "Detalles sobre el inicio de los síntomas..." },
                  { id: "nota", label: "Nota Adicional / Comentarios", placeholder: "Notas opcionales..." },
                ].map(({ id, label, required, placeholder }) => (
                  <div key={id} className="space-y-2">
                    <Label htmlFor={id}>{label} {required && <span className="text-destructive">*</span>}</Label>
                    <Textarea id={id} placeholder={placeholder} rows={required ? 3 : 2}
                      value={(diagnosticoForm as any)[id]} required={required}
                      onChange={(e) => setDiag(id, e.target.value)} />
                  </div>
                ))}

                <div className="border-t border-border/80 pt-4 mt-2">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Resolución / Reducción (Opcional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fecha_hora_reduccion">Fecha y Hora de Resolución</Label>
                      <Input id="fecha_hora_reduccion" type="datetime-local" value={diagnosticoForm.fecha_hora_reduccion}
                        onChange={(e) => setDiag("fecha_hora_reduccion", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edad_reduccion">Edad de Resolución</Label>
                      <Input id="edad_reduccion" type="number" placeholder="Ej: 31" min="0"
                        value={diagnosticoForm.edad_reduccion} onChange={(e) => setDiag("edad_reduccion", e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="descripcion_reduccion">Descripción de la Resolución</Label>
                    <Textarea id="descripcion_reduccion" rows={2} placeholder="Cómo se resolvió o redujo la patología..."
                      value={diagnosticoForm.descripcion_reduccion} onChange={(e) => setDiag("descripcion_reduccion", e.target.value)} />
                  </div>
                </div>

                <div className="flex justify-between pt-3">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>Atrás</Button>
                  <SubmitBtn submitting={submitting} label="Siguiente: Recetas" />
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* PASO 3 */}
        {currentStep === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="border-border lg:col-span-7 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Pill className="w-5 h-5 text-primary" />Paso 3 — Emitir Recetas Médicas</CardTitle>
                <CardDescription>Configure y añada recetas. Puede agregar múltiples.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddReceta} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Medicamento <span className="text-destructive">*</span></Label>
                    <Select value={recetasForm.medicamentoId} onValueChange={(v) => setReceta("medicamentoId", v)}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar medicamento del catálogo" /></SelectTrigger>
                      <SelectContent>
                        {medicamentosCatalogo.map((med) => (
                          <SelectItem key={med.id} value={med.id.toString()}>{med.nombre} (Stock: {med.stock})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Intención / Propósito <span className="text-destructive">*</span></Label>
                    <Textarea placeholder="Ej: Controlar la fiebre..." value={recetasForm.intencion}
                      onChange={(e) => setReceta("intencion", e.target.value)} rows={2} required />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: "categoria", label: "Categoría", options: [["controlado", "Controlado"], ["libre", "Libre venta"], ["retenida", "Retenida"]] },
                      { id: "prioridad", label: "Prioridad", options: [["alta", "Alta"], ["media", "Media"], ["baja", "Baja"]] },
                    ].map(({ id, label, options }) => (
                      <div key={id} className="space-y-2">
                        <Label>{label} <span className="text-destructive">*</span></Label>
                        <Select value={(recetasForm as any)[id]} onValueChange={(v) => setReceta(id, v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {options.map(([val, lbl]) => <SelectItem key={val} value={val}>{lbl}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  {[
                    { id: "instruccion_dosis", label: "Instrucciones de Dosis", placeholder: "Ej: 1 tableta cada 8 horas" },
                    { id: "periodo_dosis", label: "Período de Dosis", placeholder: "Ej: Por 7 días" },
                  ].map(({ id, label, placeholder }) => (
                    <div key={id} className="space-y-2">
                      <Label>{label} <span className="text-destructive">*</span></Label>
                      <Input placeholder={placeholder} value={(recetasForm as any)[id]}
                        onChange={(e) => setReceta(id, e.target.value)} required />
                    </div>
                  ))}
                  <div className="space-y-2">
                    <Label>Cantidad a Suministrar <span className="text-destructive">*</span></Label>
                    <Input type="number" placeholder="Ej: 20" min="1" value={recetasForm.cantidad_suministrada}
                      onChange={(e) => setReceta("cantidad_suministrada", e.target.value)} required />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <Plus className="w-4 h-4" /> Registrar y Añadir Receta
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="lg:col-span-5 flex flex-col gap-4">
              <Card className="border-border flex-1 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span>Recetas Emitidas ({recetasEmitidas.length})</span>
                    {loadingRecetas && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[480px] overflow-y-auto">
                  {recetasEmitidas.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Pill className="w-8 h-8 mx-auto opacity-40 mb-3" />
                      <p className="text-sm font-medium">Ninguna receta emitida aún.</p>
                    </div>
                  ) : recetasEmitidas.map((r) => (
                    <div key={r.id} className="p-4 border border-border/80 rounded-xl bg-secondary/10 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-sm text-foreground">{r.medicamento_nombre}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{r.intencion}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button variant="ghost" size="sm" onClick={() => descargarPDF(r.id)} className="h-6 w-6 p-0">
                            <Download className="w-3 h-3" />
                          </Button>
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none capitalize text-[10px]">{r.categoria}</Badge>
                        </div>
                      </div>
                      <div className="text-xs text-foreground/80 grid grid-cols-2 gap-1.5 pt-1.5 border-t border-border/60">
                        <div><strong>Dosis:</strong> {r.instruccion_dosis}</div>
                        <div><strong>Período:</strong> {r.periodo_dosis}</div>
                        <div className="col-span-2">
                          <strong>Cantidad:</strong> {r.cantidad_suministrada} unid.
                          (S/ {Number((r.medicamento_costo ?? 0) * r.cantidad_suministrada).toFixed(2)})
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <NavButtons
                onBack={() => setCurrentStep(2)} onNext={() => setCurrentStep(4)}
                nextLabel="Siguiente: Despacho"
                showSkip={recetasEmitidas.length === 0} onSkip={() => setCurrentStep(4)}
              />
            </div>
          </div>
        )}

        {/* PASO 4 */}
        {currentStep === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="border-border lg:col-span-7 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />Paso 4 — Despachar Medicamentos
                </CardTitle>
                <CardDescription>Despache medicamentos del inventario del hospital para esta cita.</CardDescription>
                <div className="mt-4">
                  <Input placeholder="Buscar medicamentos..." value={searchMed}
                    onChange={(e) => setSearchMed(e.target.value)} className="focus-visible:ring-primary" />
                </div>
              </CardHeader>
              <CardContent className="max-h-[420px] overflow-y-auto">
                <div className="border border-border/60 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medicamento</TableHead>
                        <TableHead className="text-center">Stock</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-right">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMeds.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8 text-xs">No se encontraron medicamentos.</TableCell></TableRow>
                      ) : filteredMeds.map((med) => (
                        <TableRow key={med.id}>
                          <TableCell className="font-medium text-xs">
                            <div>{med.nombre}</div>
                            <span className="text-[10px] text-muted-foreground bg-secondary/80 px-1.5 py-0.5 rounded capitalize">{med.tipo}</span>
                          </TableCell>
                          <TableCell className="text-center text-xs">
                            <span className={med.stock <= 0 ? "text-destructive font-bold" : ""}>{med.stock}</span>
                          </TableCell>
                          <TableCell className="text-right text-xs">S/ {Number(med.costo).toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" disabled={med.stock <= 0} onClick={() => addToDespachoCart(med)}
                              className="h-8 text-xs border-primary/20 text-primary hover:bg-primary/5">
                              {despachoCart.some((i) => i.id === med.id) ? "Añadir más" : "Añadir"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-5 flex flex-col gap-4">
              <Card className="border-border flex-1 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Medicamentos a Despachar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[350px] overflow-y-auto">
                  {despachoCart.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      <ShoppingCart className="w-8 h-8 mx-auto opacity-35 mb-2" />
                      No se han seleccionado medicamentos.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {despachoCart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between border-b border-border/60 pb-3">
                          <div className="flex-1 min-w-0 pr-2">
                            <h4 className="font-medium text-xs text-foreground truncate">{item.nombre}</h4>
                            <p className="text-[10px] text-muted-foreground">Stock máximo: {item.stock}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {[
                              { label: "−", onClick: () => updateCartQty(item.id, item.cantidad - 1) },
                              { label: "+", onClick: () => updateCartQty(item.id, item.cantidad + 1) },
                            ].map(({ label, onClick }, i) => (
                              <Button key={i} variant="outline" size="icon" className="h-7 w-7 rounded-md" onClick={onClick}>{label}</Button>
                            ))}
                            <Input type="number" className="h-7 w-12 text-center text-xs p-1 focus-visible:ring-0"
                              value={item.cantidad} min="1" max={item.stock}
                              onChange={(e) => updateCartQty(item.id, parseInt(e.target.value) || 1)} />
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() => removeFromDespachoCart(item.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <NavButtons
                onBack={() => setCurrentStep(3)}
                nextLabel="Confirmar Despacho" submitting={submitting}
                showSkip={despachoCart.length === 0} onSkip={() => setCurrentStep(5)}
                onNext={despachoCart.length > 0 ? handleDespacho : undefined}
              />
            </div>
          </div>
        )}

        {/* PASO 5 */}
        {currentStep === 5 && (
          <Card className="border-border max-w-3xl mx-auto shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Landmark className="w-5 h-5 text-primary" />Paso 5 — Facturación y Cierre</CardTitle>
              <CardDescription>Revise el desglose de costos y registre el pago para cerrar la atención.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingResumen ? (
                <div className="flex items-center justify-center py-8 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground font-medium">Calculando desglose de pago...</span>
                </div>
              ) : (
                <form onSubmit={handleFinalizeAttention} className="space-y-6">
                  <div className="border border-border/80 rounded-xl bg-secondary/5 overflow-hidden">
                    <div className="p-4 bg-secondary/15 border-b border-border/60">
                      <h3 className="font-semibold text-sm text-foreground">Desglose de Conceptos</h3>
                    </div>
                    <div className="p-4 space-y-4 text-xs">
                      <div className="flex justify-between items-center text-sm border-b border-border/40 pb-2">
                        <span className="text-muted-foreground font-medium">Consulta / Especialidad ({resumenPago?.especialidad})</span>
                        <span className="font-semibold">S/ {Number(resumenPago?.costo_consulta).toFixed(2)}</span>
                      </div>
                      {(resumenPago?.medicamentos?.length ?? 0) > 0 && (
                        <div className="space-y-2 border-b border-border/40 pb-3">
                          <span className="text-muted-foreground font-medium block">Medicamentos:</span>
                          <div className="bg-background rounded-lg border border-border/60 overflow-hidden">
                            <Table>
                              <TableHeader className="bg-secondary/10">
                                <TableRow>
                                  {["Item", "Cant", "Unitario", "Subtotal"].map((h) => (
                                    <TableHead key={h} className="h-8 text-[10px]">{h}</TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {resumenPago!.medicamentos.map((med, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell className="py-1.5 font-medium text-[11px]">{med.medicamento}</TableCell>
                                    <TableCell className="py-1.5 text-center text-[11px]">{med.cantidad}</TableCell>
                                    <TableCell className="py-1.5 text-right text-[11px]">S/ {Number(med.costo_unit).toFixed(2)}</TableCell>
                                    <TableCell className="py-1.5 text-right text-[11px] font-semibold">S/ {Number(med.subtotal).toFixed(2)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                      <div className="space-y-1.5 pt-1.5">
                        {resumenPago?.costo_medicamentos ? (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Subtotal Medicamentos:</span>
                            <span className="font-medium">S/ {Number(resumenPago.costo_medicamentos).toFixed(2)}</span>
                          </div>
                        ) : null}
                        <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-border/60">
                          <span className="text-foreground">Importe Total Calculado:</span>
                          <span className="text-teal-600 text-base">S/ {Number(resumenPago?.monto_total).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="monto_total">Monto Total a Cobrar (S/) <span className="text-destructive">*</span></Label>
                      <Input id="monto_total" type="number" step="0.01" placeholder="0.00" value={montoTotal}
                        onChange={(e) => setMontoTotal(e.target.value)} required
                        className="font-semibold text-teal-700 bg-teal-500/5 focus-visible:ring-primary" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descripcion_pago">Descripción de Factura</Label>
                      <Textarea id="descripcion_pago" rows={2} placeholder="Ej: Consulta cardiológica y despacho de tabletas..."
                        value={descripcionPago} onChange={(e) => setDescripcionPago(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-border">
                    <Button type="button" variant="outline" onClick={() => setCurrentStep(4)}>Atrás</Button>
                    <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-8 gap-2">
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      Completar Atención y Registrar Pago
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
