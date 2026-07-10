import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Stethoscope, FileText, AlertCircle, DollarSign, CheckCircle2, Pill } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";

// ── Tipos ──────────────────────────────────────────────────────────────────

interface CitaItem {
  id: number;
  inicio?: string;
  especialidad?: string;
  estado?: string;
  costo_servicio?: number;
  paciente?: any;
  paciente_nombre?: string;
}

interface Diagnostico {
  id: number;
  estado_clinico: string;
  categoria: string;
  severidad: string;
  ubicacion_anatomica: string;
  fecha_hora_inicio: string;
  descripcion_inicio: string;
  nota?: string;
}

interface Receta {
  id: number;
  medicamento_id: number;
  medicamento_nombre: string;
  medicamento_costo?: number;
  intencion: string;
  categoria: string;
  instruccion_dosis: string;
  cantidad_suministrada: number;
}

interface Medicamento {
  id: number;
  nombre: string;
  costo: number;
  stock: number;
}

// ── Constantes ─────────────────────────────────────────────────────────────

const severidadColor: Record<string, string> = {
  leve: "bg-green-100 text-green-700 border-green-200",
  moderado: "bg-yellow-100 text-yellow-700 border-yellow-200",
  grave: "bg-orange-100 text-orange-700 border-orange-200",
  critico: "bg-red-100 text-red-700 border-red-200",
};

const toDatetimeLocal = (d = new Date()) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const DIAG_INIT = {
  estado_clinico: "", categoria: "", severidad: "", ubicacion: "",
  edad_inicio: "" as number | "", descripcion_inicio: "",
  fecha_hora_inicio: toDatetimeLocal(), nota: "",
};

const RECETA_INIT = {
  medicamentoId: "", intencion: "", categoria: "", prioridad: "",
  instruccion_dosis: "", periodo_dosis: "", cantidad_suministrada: "" as number | "",
};

// ── Componente principal ────────────────────────────────────────────────────

const DoctorDiagnosticos = () => {
  const [searchParams] = useSearchParams();
  const [citas, setCitas] = useState<CitaItem[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [selected, setSelected] = useState<CitaItem | null>(null);

  const [historial, setHistorial] = useState<Diagnostico[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [activeTab, setActiveTab] = useState("diagnosticos");

  // Formularios consolidados
  const [diagForm, setDiagForm] = useState(DIAG_INIT);
  const [recetaForm, setRecetaForm] = useState(RECETA_INIT);
  const setDiag = (field: string, value: any) => setDiagForm((p) => ({ ...p, [field]: value }));
  const setReceta = (field: string, value: any) => setRecetaForm((p) => ({ ...p, [field]: value }));

  const [despachoItems, setDespachoItems] = useState<Array<{ medicamento: number; cantidad: number }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Fetches ───────────────────────────────────────────────────────────────

  const fetchCitas = async () => {
    setLoadingCitas(true);
    try {
      const data = await api("/citas/mis-citas-medico/?estado=en_curso");
      setCitas(Array.isArray(data) ? data : data.results ?? []);
    } catch {
      setCitas([]);
    } finally {
      setLoadingCitas(false);
    }
  };

  const fetchHistorial = async (citaId: number) => {
    setLoadingHistorial(true);
    setHistorial([]);
    setRecetas([]);
    try {
      const data = await api(`/citas/${citaId}/paciente/`);
      setHistorial(data?.historial?.diagnosticos ?? []);
      setRecetas(data?.historial?.recetas ?? []);
    } catch {
      /* vacío */
    } finally {
      setLoadingHistorial(false);
    }
  };

  const fetchMedicamentos = async () => {
    try {
      const data = await api("/medicamentos/catalogo/");
      setMedicamentos(Array.isArray(data?.results) ? data.results : []);
    } catch {
      setMedicamentos([]);
    }
  };

  useEffect(() => {
    fetchCitas();
    fetchMedicamentos();
  }, []);

  // Auto-seleccionar cita desde query param
  useEffect(() => {
    const citaId = searchParams.get("cita");
    if (citaId && citas.length > 0) {
      const found = citas.find((c) => c.id === Number(citaId));
      if (found) setSelected(found);
    }
  }, [citas, searchParams]);

  useEffect(() => {
    if (selected) {
      fetchHistorial(selected.id);
      setSuccessMsg(null);
      setFormError(null);
      resetForms();
    } else {
      setHistorial([]);
      setRecetas([]);
    }
  }, [selected]);

  const resetForms = () => {
    setDiagForm({ ...DIAG_INIT, fecha_hora_inicio: toDatetimeLocal() });
    setRecetaForm(RECETA_INIT);
    setDespachoItems([]);
  };

  const pacienteNombre = (c: CitaItem) =>
    c.paciente?.usuario?.nombre ?? c.paciente_nombre ?? "Paciente";

  // ── Wrapper de submit ─────────────────────────────────────────────────────

  const withSubmit = async (fn: () => Promise<void>) => {
    setFormError(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try { await fn(); } catch (err: any) {
      setFormError(err?.error || "Ha ocurrido un error.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSubmitDiagnostico = () => {
    if (!diagForm.estado_clinico) return setFormError("El estado clínico es obligatorio.");
    if (!diagForm.categoria) return setFormError("La categoría es obligatoria.");
    if (!diagForm.severidad) return setFormError("La severidad es obligatoria.");
    if (!diagForm.ubicacion) return setFormError("La ubicación anatómica es obligatoria.");
    if (diagForm.edad_inicio === "") return setFormError("La edad de inicio es obligatoria.");
    if (!diagForm.descripcion_inicio) return setFormError("La descripción es obligatoria.");

    withSubmit(async () => {
      await api(`/citas/${selected!.id}/diagnostico/`, {
        method: "POST",
        body: JSON.stringify({
          estado_clinico: diagForm.estado_clinico,
          categoria: diagForm.categoria,
          severidad: diagForm.severidad,
          ubicacion_anatomica: diagForm.ubicacion,
          fecha_hora_inicio: new Date(diagForm.fecha_hora_inicio).toISOString(),
          edad_inicio: Number(diagForm.edad_inicio),
          descripcion_inicio: diagForm.descripcion_inicio,
          nota: diagForm.nota || undefined,
        }),
      });
      setSuccessMsg("Diagnóstico registrado correctamente.");
      setDiagForm({ ...DIAG_INIT, fecha_hora_inicio: toDatetimeLocal() });
      fetchHistorial(selected!.id);
    });
  };

  const handleSubmitReceta = () => {
    const { medicamentoId, intencion, categoria, prioridad, instruccion_dosis, cantidad_suministrada } = recetaForm;
    if (!medicamentoId) return setFormError("Debes seleccionar un medicamento.");
    if (!intencion) return setFormError("La intención es obligatoria.");
    if (!categoria) return setFormError("La categoría es obligatoria.");
    if (!prioridad) return setFormError("La prioridad es obligatoria.");
    if (!instruccion_dosis) return setFormError("Las instrucciones de dosis son obligatorias.");
    if (!cantidad_suministrada) return setFormError("La cantidad es obligatoria.");

    withSubmit(async () => {
      await api(`/citas/${selected!.id}/receta/`, {
        method: "POST",
        body: JSON.stringify({
          medicamento: parseInt(medicamentoId),
          intencion, categoria, prioridad,
          instruccion_dosis,
          periodo_dosis: recetaForm.periodo_dosis || "Según indicaciones",
          cantidad_suministrada: Number(cantidad_suministrada),
        }),
      });
      setSuccessMsg("Receta emitida correctamente.");
      setRecetaForm(RECETA_INIT);
      fetchHistorial(selected!.id);
    });
  };

  const handleDespacharMedicamentos = () => {
    if (despachoItems.length === 0) return setFormError("Debes agregar al menos un medicamento.");
    withSubmit(async () => {
      await api(`/medicamentos/despachar/${selected!.id}/`, {
        method: "POST",
        body: JSON.stringify({ items: despachoItems }),
      });
      setSuccessMsg("Medicamentos despachados correctamente.");
      setDespachoItems([]);
      fetchMedicamentos();
    });
  };

  const handleGenerarFactura = () => {
    withSubmit(async () => {
      const resumen = await api(`/citas/${selected!.id}/resumen-pago/`);
      const monto: number = resumen.monto_total || 0;
      await api(`/citas/${selected!.id}/estado/`, {
        method: "PATCH",
        body: JSON.stringify({ estado: "completada" }),
      });
      setSuccessMsg(`Factura generada. Total: S/ ${monto.toFixed(2)}. Cita completada.`);
      setSelected(null);
      fetchCitas();
    });
  };

  // Helpers de despacho
  const adjustDespacho = (id: number, delta: number) =>
    setDespachoItems((prev) =>
      prev.map((i) => i.medicamento === id ? { ...i, cantidad: Math.max(1, i.cantidad + delta) } : i)
    );

  const removeDespacho = (id: number) =>
    setDespachoItems((prev) => prev.filter((i) => i.medicamento !== id));

  const addDespacho = (id: number) =>
    setDespachoItems((prev) => [...prev, { medicamento: id, cantidad: 1 }]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Atender Cita</h1>
        <p className="text-muted-foreground mt-1">Flujo completo: diagnóstico, recetas, medicamentos y facturación.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Panel izquierdo: Lista de citas */}
        <div className="md:col-span-4 space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-primary" /> Citas para atender
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCitas ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Cargando citas…</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {citas.filter((c) => c.estado === "en_curso").length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay citas en curso.</p>
                  ) : (
                    citas.filter((c) => c.estado === "en_curso").map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelected(c)}
                        className={`w-full p-3 border rounded-lg text-left transition-all ${
                          selected?.id === c.id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-secondary/50"
                        }`}
                      >
                        <div className="font-semibold text-sm">{pacienteNombre(c)}</div>
                        <div className="text-xs text-muted-foreground">{c.especialidad ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {c.inicio ? new Date(c.inicio).toLocaleString() : "—"}
                        </div>
                        <Badge className="mt-2">{c.estado ?? "confirmada"}</Badge>
                      </button>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel derecho: Tabs de acción */}
        <div className="md:col-span-8">
          {!selected ? (
            <Card className="border-border">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Selecciona una cita para atender
              </CardContent>
            </Card>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                {[
                  { value: "diagnosticos", icon: Stethoscope, label: "Diagnóstico" },
                  { value: "recetas", icon: Pill, label: "Recetas" },
                  { value: "medicamentos", icon: FileText, label: "Medicinas" },
                  { value: "factura", icon: DollarSign, label: "Factura" },
                ].map(({ value, icon: Icon, label }) => (
                  <TabsTrigger key={value} value={value} className="text-xs">
                    <Icon className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Mensajes globales */}
              {formError && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4" /> {formError}
                </div>
              )}
              {successMsg && (
                <div className="bg-green-100 text-green-700 p-3 rounded-lg text-sm mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {successMsg}
                </div>
              )}

              {/* TAB: Diagnósticos */}
              <TabsContent value="diagnosticos" className="space-y-4">
                <Card className="border-border">
                  <CardHeader><CardTitle className="text-sm">Diagnósticos previos</CardTitle></CardHeader>
                  <CardContent>
                    {loadingHistorial ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Cargando…</span>
                      </div>
                    ) : historial.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No hay diagnósticos previos</p>
                    ) : (
                      <div className="space-y-2">
                        {historial.map((d) => (
                          <div key={d.id} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <p className="font-semibold text-sm">{d.estado_clinico}</p>
                                <p className="text-xs text-muted-foreground">{new Date(d.fecha_hora_inicio).toLocaleString()}</p>
                              </div>
                              <Badge className={`text-xs border ${severidadColor[d.severidad] || ""}`}>{d.severidad}</Badge>
                            </div>
                            <p className="text-sm text-foreground/80 mt-2">{d.descripcion_inicio}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardHeader><CardTitle className="text-sm">Registrar nuevo diagnóstico</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { field: "estado_clinico", label: "Estado clínico", placeholder: "Ej: Hipertensión Arterial" },
                        { field: "categoria", label: "Categoría", placeholder: "Ej: Cardiovascular" },
                        { field: "ubicacion", label: "Ubicación anatómica", placeholder: "Sistema afectado" },
                      ].map(({ field, label, placeholder }) => (
                        <div key={field} className="space-y-1.5">
                          <Label>{label}</Label>
                          <Input value={(diagForm as any)[field]} placeholder={placeholder}
                            onChange={(e) => setDiag(field, e.target.value)} />
                        </div>
                      ))}

                      <div className="space-y-1.5">
                        <Label>Severidad</Label>
                        <Select value={diagForm.severidad} onValueChange={(v) => setDiag("severidad", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["leve", "moderado", "grave", "critico"].map((v) => (
                              <SelectItem key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Edad de inicio</Label>
                        <Input type="number" placeholder="Años" value={diagForm.edad_inicio}
                          onChange={(e) => setDiag("edad_inicio", e.target.value === "" ? "" : Number(e.target.value))} />
                      </div>

                      <div className="space-y-1.5">
                        <Label>Fecha y hora</Label>
                        <Input type="datetime-local" value={diagForm.fecha_hora_inicio}
                          onChange={(e) => setDiag("fecha_hora_inicio", e.target.value)} />
                      </div>

                      {[
                        { field: "descripcion_inicio", label: "Descripción", placeholder: "Síntomas y observaciones" },
                        { field: "nota", label: "Nota adicional (opcional)", placeholder: "" },
                      ].map(({ field, label, placeholder }) => (
                        <div key={field} className="space-y-1.5 md:col-span-2">
                          <Label>{label}</Label>
                          <Textarea value={(diagForm as any)[field]} placeholder={placeholder} rows={2}
                            onChange={(e) => setDiag(field, e.target.value)} />
                        </div>
                      ))}
                    </div>

                    <Button onClick={handleSubmitDiagnostico} disabled={submitting} className="w-full gap-2">
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {submitting ? "Registrando..." : "Registrar Diagnóstico"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB: Recetas */}
              <TabsContent value="recetas" className="space-y-4">
                <Card className="border-border">
                  <CardHeader><CardTitle className="text-sm">Recetas emitidas</CardTitle></CardHeader>
                  <CardContent>
                    {recetas.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No hay recetas emitidas</p>
                    ) : (
                      <div className="space-y-2">
                        {recetas.map((r) => (
                          <div key={r.id} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-sm">{r.medicamento_nombre}</p>
                                <p className="text-xs text-foreground/70 mt-1">Dosis: {r.instruccion_dosis}</p>
                                <p className="text-xs text-foreground/70">Cantidad: {r.cantidad_suministrada}</p>
                              </div>
                              <Badge className="text-xs">{r.categoria}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardHeader><CardTitle className="text-sm">Emitir nueva receta</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Medicamento</Label>
                      <Select value={recetaForm.medicamentoId} onValueChange={(v) => setReceta("medicamentoId", v)}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar medicamento" /></SelectTrigger>
                        <SelectContent>
                          {medicamentos.map((med) => (
                            <SelectItem key={med.id} value={med.id.toString()}>
                              {med.nombre} (Stock: {med.stock})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Intención / Propósito</Label>
                      <Textarea value={recetaForm.intencion} placeholder="Motivo de la receta" rows={2}
                        onChange={(e) => setReceta("intencion", e.target.value)} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { field: "categoria", label: "Categoría", options: [["controlado", "Controlado"], ["libre", "Libre venta"], ["retenida", "Retenida"]] },
                        { field: "prioridad", label: "Prioridad", options: [["alta", "Alta"], ["media", "Media"], ["baja", "Baja"]] },
                      ].map(({ field, label, options }) => (
                        <div key={field} className="space-y-1.5">
                          <Label>{label}</Label>
                          <Select value={(recetaForm as any)[field]} onValueChange={(v) => setReceta(field, v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {options.map(([val, lbl]) => <SelectItem key={val} value={val}>{lbl}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>

                    {[
                      { field: "instruccion_dosis", label: "Instrucción de dosis", placeholder: "Ej: 1 tableta cada 12 horas" },
                      { field: "periodo_dosis", label: "Período de dosis", placeholder: "Ej: Por 30 días" },
                    ].map(({ field, label, placeholder }) => (
                      <div key={field} className="space-y-1.5">
                        <Label>{label}</Label>
                        <Input value={(recetaForm as any)[field]} placeholder={placeholder}
                          onChange={(e) => setReceta(field, e.target.value)} />
                      </div>
                    ))}

                    <div className="space-y-1.5">
                      <Label>Cantidad a suministrar</Label>
                      <Input type="number" placeholder="Cantidad" value={recetaForm.cantidad_suministrada}
                        onChange={(e) => setReceta("cantidad_suministrada", e.target.value === "" ? "" : Number(e.target.value))} />
                    </div>

                    <Button onClick={handleSubmitReceta} disabled={submitting} className="w-full gap-2">
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {submitting ? "Emitiendo..." : "Emitir Receta"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB: Medicamentos */}
              <TabsContent value="medicamentos" className="space-y-4">
                <Card className="border-border">
                  <CardHeader><CardTitle className="text-sm">Despachar medicamentos</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-secondary/30 border border-border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                      <p className="text-xs font-semibold text-foreground">Selecciona medicamentos:</p>
                      {medicamentos.map((med) => {
                        const item = despachoItems.find((i) => i.medicamento === med.id);
                        return (
                          <div key={med.id} className="flex items-center justify-between">
                            <span className="text-sm">{med.nombre}</span>
                            {item ? (
                              <div className="flex items-center gap-1">
                                <Button variant="outline" size="sm" className="h-6 w-6 p-0"
                                  onClick={() => adjustDespacho(med.id, -1)}>−</Button>
                                <span className="w-6 text-center text-xs font-semibold">{item.cantidad}</span>
                                <Button variant="outline" size="sm" className="h-6 w-6 p-0"
                                  onClick={() => adjustDespacho(med.id, 1)}>+</Button>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive"
                                  onClick={() => removeDespacho(med.id)}>✕</Button>
                              </div>
                            ) : (
                              <Button variant="outline" size="sm" className="h-6" onClick={() => addDespacho(med.id)}>
                                Agregar
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {despachoItems.length > 0 && (
                      <div className="bg-primary/5 border border-primary rounded-lg p-3 space-y-2">
                        <p className="text-xs font-semibold">Medicamentos seleccionados:</p>
                        <ul className="space-y-1">
                          {despachoItems.map((item) => {
                            const med = medicamentos.find((m) => m.id === item.medicamento);
                            return (
                              <li key={item.medicamento} className="text-xs flex justify-between">
                                <span>{med?.nombre}</span>
                                <span className="font-semibold">x{item.cantidad}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    <Button onClick={handleDespacharMedicamentos} disabled={submitting || despachoItems.length === 0} className="w-full gap-2">
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {submitting ? "Despachando..." : "Despachar Medicamentos"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB: Factura */}
              <TabsContent value="factura" className="space-y-4">
                <Card className="border-border">
                  <CardHeader><CardTitle className="text-sm">Generar factura y completar cita</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-secondary/30 p-4 rounded-lg space-y-2 text-sm">
                      <p className="font-semibold">Resumen de cita:</p>
                      {[
                        ["Paciente", pacienteNombre(selected)],
                        ["Especialidad", selected.especialidad || "—"],
                        ["Costo de consulta", `S/ ${Number(selected.costo_servicio || 0).toFixed(2)}`],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="flex justify-between">
                          <span>{label}:</span>
                          <span className="font-semibold">{value}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 space-y-1">
                        <div className="flex justify-between">
                          <span>Recetas emitidas:</span>
                          <span className="font-semibold">{recetas.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Medicamentos despachados:</span>
                          <span className="font-semibold">{despachoItems.length}</span>
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleGenerarFactura} disabled={submitting} className="w-full gap-2 bg-green-600 hover:bg-green-700">
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {submitting ? "Generando factura..." : "Generar Factura y Completar"}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Al completar, se generará una factura por el servicio médico.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDiagnosticos;
