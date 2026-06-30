import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pill, Plus, Calendar, User, Loader2, AlertCircle, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
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
    const token = localStorage.getItem("access");
    try {
      const res = await fetch(`${config.api.baseUrl}/recetas/${recetaId}/pdf/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al descargar PDF");
      const blob = await res.blob();
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

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!selectedCita) {
      setError("Debes seleccionar una cita");
      return;
    }
    if (!medicamentoId) {
      setError("Debes seleccionar un medicamento");
      return;
    }
    if (!intencion) {
      setError("La intención es obligatoria");
      return;
    }
    if (!categoria) {
      setError("La categoría es obligatoria");
      return;
    }
    if (!prioridad) {
      setError("La prioridad es obligatoria");
      return;
    }
    if (!instruccionDosis) {
      setError("Las instrucciones de dosis son obligatorias");
      return;
    }
    if (cantidadSuministrada === "" || cantidadSuministrada === 0) {
      setError("La cantidad es obligatoria");
      return;
    }

    const payload = {
      medicamento: parseInt(medicamentoId),
      intencion,
      categoria,
      prioridad,
      instruccion_dosis: instruccionDosis,
      periodo_dosis: periodoDosis || "Según indicaciones",
      cantidad_suministrada: Number(cantidadSuministrada),
    };

    setSubmitting(true);
    try {
      await api(`/citas/${selectedCita}/receta/`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSuccess("Receta emitida correctamente");
      // Clear form
      setMedicamentoId("");
      setIntencion("");
      setCategoria("");
      setPrioridad("");
      setInstruccionDosis("");
      setPeriodoDosis("");
      setCantidadSuministrada("");
      // Reload recetas
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
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full gap-2"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitting ? "Emitiendo..." : "Emitir Receta"}
                  </Button>
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
