import { useEffect, useState } from "react";
import { api, downloadBlob } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Pill, Plus, Calendar, User, Loader2, AlertCircle, Download, Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import config from "@/config/env";

interface Receta {
  id: number;
  medicamento: { nombre: string; costo: number };
  intencion: string;
  categoria: string;
  prioridad: string;
  instruccion_dosis: string;
  periodo_dosis: string;
  cantidad_suministrada: number;
  fecha_emitida: string;
}

interface Cita {
  id: number;

  paciente: number;
  paciente_nombre: string;

  especialidad: string;
  inicio: string;
}
interface Medicamento {
  id: number;
  nombre: string;
  costo: number;
  stock: number;
}

const DoctorRecetas = () => {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [selectedCita, setSelectedCita] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [medicamentoId, setMedicamentoId] = useState<string>("");
  const [intencion, setIntencion] = useState("");
  const [categoria, setCategoria] = useState("");
  const [prioridad, setPrioridad] = useState("");
  const [instruccionDosis, setInstruccionDosis] = useState("");
  const [periodoDosis, setPeriodoDosis] = useState("");
  const [cantidadSuministrada, setCantidadSuministrada] = useState<number | "">("");

  // Preview
  const [showPreview, setShowPreview] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<any>(null);

  const fetchCitas = async () => {
    setLoading(true);
    try {
      const data = await api("/citas/mis-citas-medico/?estado=confirmada");
      setCitas(Array.isArray(data) ? data : []);
    } catch (err) {
      setCitas([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicamentos = async () => {
    try {
      const data = await api("/medicamentos/catalogo/");
      setMedicamentos(Array.isArray(data?.results) ? data.results : []);
    } catch (err) {
      setMedicamentos([]);
    }
  };

  const fetchRecetas = async (citaId: number) => {
    try {
      const data = await api(`/citas/${citaId}/receta/`);
      setRecetas(Array.isArray(data) ? data : []);
    } catch (err) {
      setRecetas([]);
    }
  };

  const descargarPDF = async (recetaId: number) => {
    try {
      const blob = await downloadBlob(`/recetas/${recetaId}/pdf/`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receta_${recetaId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchCitas();
    fetchMedicamentos();
  }, []);

  useEffect(() => {
    if (selectedCita) {
      fetchRecetas(selectedCita);
      setError(null);
      setSuccess(null);
    }
  }, [selectedCita]);

  const buildPayload = () => {
    if (!selectedCita) { setError("Debes seleccionar una cita"); return null; }
    if (!medicamentoId) { setError("Debes seleccionar un medicamento"); return null; }
    if (!intencion) { setError("La intención es obligatoria"); return null; }
    if (!categoria) { setError("La categoría es obligatoria"); return null; }
    if (!prioridad) { setError("La prioridad es obligatoria"); return null; }
    if (!instruccionDosis) { setError("Las instrucciones de dosis son obligatorias"); return null; }
    if (cantidadSuministrada === "" || cantidadSuministrada === 0) { setError("La cantidad es obligatoria"); return null; }
    return {
      medicamento: parseInt(medicamentoId),
      intencion, categoria, prioridad,
      instruccion_dosis: instruccionDosis,
      periodo_dosis: periodoDosis || "Según indicaciones",
      cantidad_suministrada: Number(cantidadSuministrada),
    };
  };

  const handlePreview = () => {
    setError(null);
    const payload = buildPayload();
    if (!payload) return;
    setPreviewPayload(payload);
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await api(`/citas/${selectedCita}/receta/`, {
        method: "POST",
        body: JSON.stringify(previewPayload),
      });
      setSuccess("Receta emitida correctamente");
      setShowPreview(false);
      setMedicamentoId(""); setIntencion(""); setCategoria(""); setPrioridad("");
      setInstruccionDosis(""); setPeriodoDosis(""); setCantidadSuministrada("");
      fetchRecetas(selectedCita);
    } catch (err: any) {
      setError(err?.error || "Error al emitir receta");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Recetas Médicas</h1>
        <p className="text-muted-foreground mt-1">Emite recetas vinculadas al diagnóstico del paciente.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: citas */}
        <div className="md:col-span-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Pill className="w-4 h-4 text-primary" />
                Citas confirmadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Cargando…</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {citas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay citas confirmadas</p>
                  ) : (
                    citas.map((cita) => (
                      <button
                        key={cita.id}
                        onClick={() => setSelectedCita(cita.id)}
                        className={`w-full p-3 border rounded-lg text-left transition-all ${
                          selectedCita === cita.id
                            ? "ring-2 ring-primary bg-primary/5"
                            : "hover:bg-secondary/50"
                        }`}
                      >
                        <div className="font-semibold text-sm">{cita.paciente_nombre}</div>
                        <div className="text-xs text-muted-foreground">{cita.especialidad}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(cita.inicio).toLocaleDateString()}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Form y recetas */}
        <div className="md:col-span-8 space-y-4">
          {/* Form para emitir receta */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm">Emitir nueva receta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-100 text-green-700 p-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              {!selectedCita ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Selecciona una cita para emitir receta
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Medicamento</Label>
                    <Select value={medicamentoId} onValueChange={setMedicamentoId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar medicamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {medicamentos.map((med) => (
                          <SelectItem key={med.id} value={med.id.toString()}>
                            {med.nombre} (Stock: {med.stock})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Intención/Propósito</Label>
                    <Textarea
                      value={intencion}
                      onChange={(e) => setIntencion(e.target.value)}
                      placeholder="Ej: Controlar presión arterial"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Categoría</Label>
                      <Select value={categoria} onValueChange={setCategoria}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="controlado">Controlado</SelectItem>
                          <SelectItem value="libre">Libre venta</SelectItem>
                          <SelectItem value="retenida">Retenida</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Prioridad</Label>
                      <Select value={prioridad} onValueChange={setPrioridad}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                          <SelectItem value="baja">Baja</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Instrucción de dosis</Label>
                    <Input
                      value={instruccionDosis}
                      onChange={(e) => setInstruccionDosis(e.target.value)}
                      placeholder="Ej: 1 tableta cada 12 horas"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Periodo de dosis</Label>
                    <Input
                      value={periodoDosis}
                      onChange={(e) => setPeriodoDosis(e.target.value)}
                      placeholder="Ej: Por 30 días"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Cantidad a suministrar</Label>
                    <Input
                      type="number"
                      value={cantidadSuministrada}
                      onChange={(e) => setCantidadSuministrada(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="Ej: 30"
                      min="1"
                    />
                  </div>

                  <Button
                    onClick={handlePreview}
                    className="w-full gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Vista Previa de Receta
                  </Button>

                  <Dialog open={showPreview} onOpenChange={setShowPreview}>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Pill className="w-5 h-5 text-primary" />
                          Vista Previa de Receta
                        </DialogTitle>
                      </DialogHeader>
                      {previewPayload && (
                        <div className="space-y-4 py-2">
                          <div className="border border-border/80 rounded-xl bg-secondary/5 p-5 space-y-3">
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                              <div>
                                <p className="text-sm font-bold text-foreground">
                                  {medicamentos.find((m) => m.id === previewPayload.medicamento)?.nombre || "Medicamento"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Stock disponible: {medicamentos.find((m) => m.id === previewPayload.medicamento)?.stock || 0}
                                </p>
                              </div>
                              <Badge className="capitalize">{previewPayload.categoria}</Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground">Intención / Propósito</p>
                                <p className="font-medium text-foreground">{previewPayload.intencion}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Prioridad</p>
                                <Badge variant="outline" className="capitalize">{previewPayload.prioridad}</Badge>
                              </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground">Instrucción de Dosis</p>
                                <p className="font-medium text-foreground">{previewPayload.instruccion_dosis}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Período de Dosis</p>
                                <p className="font-medium text-foreground">{previewPayload.periodo_dosis}</p>
                              </div>
                            </div>

                            <div className="bg-primary/5 rounded-lg p-3 flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">Cantidad a Suministrar</p>
                                <p className="text-lg font-bold text-foreground">{previewPayload.cantidad_suministrada} unidades</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Costo unitario</p>
                                <p className="text-sm font-semibold text-foreground">
                                  S/ {Number(medicamentos.find((m) => m.id === previewPayload.medicamento)?.costo || 0).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowPreview(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
                          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                          {submitting ? "Emitiendo..." : "Confirmar y Emitir"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recetas emitidas */}
          {selectedCita && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm">Recetas emitidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recetas.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay recetas emitidas para esta cita
                    </p>
                  ) : (
                    recetas.map((receta) => (
                      <div key={receta.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold text-sm">{receta.medicamento.nombre}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{receta.intencion}</p>
                            <p className="text-xs text-foreground/70 mt-2">
                              <strong>Dosis:</strong> {receta.instruccion_dosis}
                            </p>
                            <p className="text-xs text-foreground/70">
                              <strong>Período:</strong> {receta.periodo_dosis}
                            </p>
                            <p className="text-xs text-foreground/70">
                              <strong>Cantidad:</strong> {receta.cantidad_suministrada} unidades
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => descargarPDF(receta.id)} className="h-7 px-2">
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                            <Badge>{receta.categoria}</Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorRecetas;
