import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Calendar,
  Pill,
  Stethoscope,
  AlertCircle,
  Loader2,
  Building2,
  User,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Diagnostico {
  id: number;
  estado_clinico: string;
  categoria: string;
  severidad: string;
  severidad_display: string;
  ubicacion_anatomica: string;
  fecha_hora_inicio: string;
  descripcion_inicio: string;
  nota: string;
  medico_nombre?: string;
  medico_especialidad?: string;
  hospital_nombre?: string;
}

interface Receta {
  id: number;
  medicamento_nombre: string;
  medicamento_tipo: string;
  instruccion_dosis: string;
  periodo_dosis: string;
  cantidad_suministrada: number;
  categoria: string;
  categoria_display: string;
  prioridad: string;
  prioridad_display: string;
  fecha_emitida: string;
  medico_nombre?: string;
  hospital_nombre?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatDate = (iso: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const severidadColor: Record<string, string> = {
  leve:     "bg-green-100 text-green-700 border-green-200",
  moderado: "bg-yellow-100 text-yellow-700 border-yellow-200",
  grave:    "bg-orange-100 text-orange-700 border-orange-200",
  critico:  "bg-red-100 text-red-700 border-red-200",
};

const prioridadColor: Record<string, string> = {
  baja:  "bg-secondary text-secondary-foreground",
  media: "bg-yellow-100 text-yellow-700 border-yellow-200",
  alta:  "bg-red-100 text-red-700 border-red-200",
};

// ─────────────────────────────────────────────────────────────────────────────
//  MODAL — SUBIR HISTORIAL
// ─────────────────────────────────────────────────────────────────────────────

interface SubirModalProps {
  onSuccess: () => void;
}

const SubirHistorialModal = ({ onSuccess }: SubirModalProps) => {
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [historialExists, setHistorialExists] = useState<boolean | null>(null);
  const [historialResumen, setHistorialResumen] = useState<{ diagnosticos: number; recetas: number } | null>(null);

  // Observación (form cuando el historial está vacío)
  const [motivo, setMotivo] = useState("");
  const [descripcionObs, setDescripcionObs] = useState("");
  const [tipoConsulta, setTipoConsulta] = useState("presencial");

  

  // Archivo PDF enviado al backend y resumen resultante
  const [archivoPdf, setArchivoPdf] = useState<File | null>(null);
  const [resumenPdf, setResumenPdf] = useState<{
    diagnosticos_creados: number;
    recetas_creadas: number;
    recetas_omitidas: string[];
  } | null>(null);

  const resetForm = () => {
    setMotivo("");
    setDescripcionObs("");
    setTipoConsulta("presencial");
    setError(null);
    setArchivoPdf(null);
    setResumenPdf(null);
  };


  const openAndCheck = async () => {
    setError(null);
    setFetching(true);
    setHistorialExists(null);
    setHistorialResumen(null);
    setOpen(true);

    try {
      const data = await api("/historiales/mi-historial/");
      const diags = Array.isArray(data?.diagnosticos) ? data.diagnosticos.length : 0;
      const recs = Array.isArray(data?.recetas) ? data.recetas.length : 0;
      const has = diags > 0 || recs > 0;
      setHistorialExists(has);
      setHistorialResumen({ diagnosticos: diags, recetas: recs });
    } catch (err: any) {
      setError("No se pudo verificar el historial. Verifica tu conexión.");
    } finally {
      setFetching(false);
    }
  };

const handleSubmitObservacion = async () => {
  if (!motivo.trim()) {
    setError("El motivo de consulta es obligatorio.");
    return;
  }
  if (motivo.trim().length < 5) {
    setError("El motivo debe tener al menos 5 caracteres.");
    return;
  }
  if (!descripcionObs.trim()) {
    setError("La descripción es obligatoria.");
    return;
  }
  if (descripcionObs.trim().length < 10) {
    setError("La descripción debe tener al menos 10 caracteres.");
    return;
  }
    setSubmitLoading(true);
    setError(null);

    try {
      if (archivoPdf) {
        const formData = new FormData();
        formData.append("archivo", archivoPdf);

        const dataPdf = await api("/historiales/subir-pdf/", {
          method: "POST",
          body: formData,
        });

        setResumenPdf(dataPdf.resumen);
      }

      // Guardar la observación con los campos del formulario
      console.log("💾 Guardando observación:", { motivo, descripcionObs, tipoConsulta });
      await api("/historiales/subir/", {
        method: "POST",
        body: JSON.stringify({
          observaciones: [{
            motivo_consulta: motivo,
            descripcion:     descripcionObs,
            tipo_consulta:   tipoConsulta,
          }],
        }),
      });

      console.log("✅ Observación guardada correctamente");
      onSuccess();

      if (!archivoPdf) {
        setOpen(false);
        resetForm();
      } else {
        setTimeout(() => { setOpen(false); resetForm(); }, 2500);
      }

    } catch (err: any) {
      console.error("❌ Error final:", err);
      setError(err?.message ?? err?.error ?? "Error al guardar. Intenta nuevamente.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <>
      <Button className="gap-2" onClick={openAndCheck} type="button">
        <Upload className="w-4 h-4" />
        Subir Historial
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { resetForm(); setHistorialExists(null); setHistorialResumen(null); setError(null); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Subir Historial Médico
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-2 font-normal">
              Puedes consultar tu historial en papel como referencia y completar los campos a continuación.
            </p>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Estado de fetch inicial */}
            {fetching && (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Verificando tu historial…</p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
                <Button size="sm" variant="outline" onClick={openAndCheck} type="button">
                  Reintentar
                </Button>
              </div>
            )}

            {/* Caso A: Ya tiene historial con registros */}
            {historialExists && historialResumen && (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Ya tienes un historial registrado</h3>
                    <p className="text-sm text-muted-foreground mt-1">Tu historial médico ya contiene registros.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <Card className="border-border">
                    <CardContent className="p-3 text-center">
                      <p className="text-lg font-bold text-primary">{historialResumen.diagnosticos}</p>
                      <p className="text-xs text-muted-foreground">Diagnósticos</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border">
                    <CardContent className="p-3 text-center">
                      <p className="text-lg font-bold text-primary">{historialResumen.recetas}</p>
                      <p className="text-xs text-muted-foreground">Recetas</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end pt-2">
                  <DialogClose asChild>
                    <Button variant="outline" type="button">
                      Cerrar
                    </Button>
                  </DialogClose>
                </div>
              </div>
            )}

            {/* Caso B: vacío o no tiene historial -> formulario observación */}
            {historialExists === false && (
              <div className="space-y-4">
                {/* Input de referencia PDF */}
                <div className="space-y-1.5">
                  <Label htmlFor="pdf-historial">
                    Historial en PDF
                    <span className="text-muted-foreground text-xs ml-1">(opcional)</span>
                  </Label>
                  <Input 
                    id="pdf-historial"
                    type="file" 
                    accept=".pdf"
                    onChange={(e) => setArchivoPdf(e.target.files?.[0] ?? null)}
                    disabled={submitLoading}
                  />
                  

                  <p className="text-xs text-muted-foreground">
                    Si subes un PDF del sistema SIEHC, se extraerán automáticamente tus diagnósticos y recetas.
                  </p>
                </div>

                {resumenPdf && (
                  <div className="bg-secondary/40 rounded-lg p-3 space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      PDF procesado correctamente
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {resumenPdf.diagnosticos_creados} diagnósticos · {resumenPdf.recetas_creadas} recetas guardadas
                    </p>
                    {resumenPdf.recetas_omitidas.length > 0 && (
                      <p className="text-xs text-yellow-600">
                        Medicamentos no encontrados en catálogo: {resumenPdf.recetas_omitidas.join(", ")}
                      </p>
                    )}
                  </div>
                )}

                {/* Motivo de consulta */}
                <div className="space-y-1.5">
                  <Label htmlFor="motivo">Motivo de consulta <span className="text-destructive">*</span></Label>
                  <Input 
                    id="motivo"
                    placeholder="Ej: Dolor de cabeza frecuente, control anual…" 
                    value={motivo} 
                    onChange={(e) => setMotivo(e.target.value)}
                    disabled={submitLoading}
                  />
                </div>

                {/* Tipo de consulta */}
                <div className="space-y-1.5">
                  <Label htmlFor="tipo-consulta">Tipo de consulta</Label>
                  <Select value={tipoConsulta} onValueChange={setTipoConsulta} disabled={submitLoading}>
                    <SelectTrigger id="tipo-consulta">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="virtual">Virtual</SelectItem>
                      <SelectItem value="emergencia">Emergencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Descripción */}
                <div className="space-y-1.5">
                  <Label htmlFor="descripcion">Descripción <span className="text-destructive">*</span></Label>
                  <Textarea 
                    id="descripcion"
                    rows={4} 
                    placeholder="Describe brevemente tus antecedentes o el motivo por el que quieres registrar tu historial…" 
                    value={descripcionObs} 
                    onChange={(e) => setDescripcionObs(e.target.value)}
                    disabled={submitLoading}
                  />
                </div>

                {/* Error inline */}
                {error && (
                  <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Botones */}
                <div className="flex justify-end gap-3 pt-2">
                  <DialogClose asChild>
                    <Button 
                      variant="outline" 
                      disabled={submitLoading}
                      type="button"
                    >
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button 
                    onClick={handleSubmitObservacion} 
                    disabled={submitLoading} 
                    className="gap-2 min-w-[140px]"
                    type="button"
                  >
                    {submitLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando…
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Guardar historial
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  CARD — DIAGNÓSTICO
// ─────────────────────────────────────────────────────────────────────────────

const DiagnosticoCard = ({ d }: { d: Diagnostico }) => (
  <Card className="border-border hover:shadow-md transition-shadow">
    <CardContent className="p-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex gap-4 flex-1">
          {/* Icono */}
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Stethoscope className="w-5 h-5 text-primary" />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground">{d.estado_clinico}</h3>
              <Badge className={`text-xs border ${severidadColor[d.severidad] ?? "bg-secondary text-secondary-foreground"}`}>
                {d.severidad_display ?? d.severidad}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(d.fecha_hora_inicio)}
              </span>
              {d.medico_nombre && (
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {d.medico_nombre}
                  {d.medico_especialidad && ` — ${d.medico_especialidad}`}
                </span>
              )}
              {d.hospital_nombre && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {d.hospital_nombre}
                </span>
              )}
            </div>

            <p className="text-sm text-foreground/80">{d.descripcion_inicio}</p>
            {d.ubicacion_anatomica && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Área:</span> {d.ubicacion_anatomica}
                {d.categoria && <span> · <span className="font-medium">Categoría:</span> {d.categoria}</span>}
              </p>
            )}
            {d.nota && (
              <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2">{d.nota}</p>
            )}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// ─────────────────────────────────────────────────────────────────────────────
//  CARD — RECETA
// ─────────────────────────────────────────────────────────────────────────────

const RecetaCard = ({ r }: { r: Receta }) => (
  <Card className="border-border hover:shadow-md transition-shadow">
    <CardContent className="p-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex gap-4 flex-1">
          {/* Icono */}
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Pill className="w-5 h-5 text-primary" />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground">{r.medicamento_nombre}</h3>
              <Badge className={`text-xs border ${prioridadColor[r.prioridad] ?? "bg-secondary text-secondary-foreground"}`}>
                {r.prioridad_display ?? r.prioridad}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {r.categoria_display ?? r.categoria}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(r.fecha_emitida)}
              </span>
              {r.medico_nombre && (
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {r.medico_nombre}
                </span>
              )}
              {r.hospital_nombre && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {r.hospital_nombre}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-foreground/80 bg-secondary/40 rounded-lg px-3 py-2">
              <Pill className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span>{r.instruccion_dosis}</span>
            </div>

            <div className="flex gap-4 text-xs text-muted-foreground">
              {r.periodo_dosis && <span><span className="font-medium">Periodo:</span> {r.periodo_dosis}</span>}
              {r.cantidad_suministrada && <span><span className="font-medium">Cantidad:</span> {r.cantidad_suministrada} unidades</span>}
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// ─────────────────────────────────────────────────────────────────────────────
//  ESTADO VACÍO
// ─────────────────────────────────────────────────────────────────────────────

const EmptyState = ({ type }: { type: "diagnosticos" | "recetas" }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
      {type === "diagnosticos"
        ? <Stethoscope className="w-8 h-8 text-primary/50" />
        : <Pill className="w-8 h-8 text-primary/50" />
      }
    </div>
    <p className="text-muted-foreground font-medium">
      {type === "diagnosticos" ? "No hay diagnósticos registrados" : "No hay recetas emitidas"}
    </p>
    <p className="text-sm text-muted-foreground mt-1">
      {type === "diagnosticos"
        ? "Tus diagnósticos aparecerán aquí tras una atención médica."
        : "Tus recetas médicas aparecerán aquí una vez que un médico las emita."
      }
    </p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  PÁGINA PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

const PatientHistorial = () => {
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [recetas, setRecetas]           = useState<Receta[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const fetchHistorial = async () => {
    setLoading(true);
    setError(null);
    try {
      const [diags, recs] = await Promise.all([
        api("/historiales/mis-diagnosticos/"),
        api("/historiales/mis-recetas/"),
      ]);
      setDiagnosticos(Array.isArray(diags) ? diags : []);
      setRecetas(Array.isArray(recs) ? recs : []);
    } catch {
      setError("No se pudo cargar el historial. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistorial(); }, []);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Historial Médico</h1>
          <p className="text-muted-foreground mt-1">Consulta tus diagnósticos y recetas médicas.</p>
        </div>
        <SubirHistorialModal onSuccess={fetchHistorial} />
      </div>

      {/* Resumen rápido */}
      {!loading && !error && (
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{diagnosticos.length}</p>
                <p className="text-xs text-muted-foreground">Diagnósticos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Pill className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{recetas.length}</p>
                <p className="text-xs text-muted-foreground">Recetas</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error global */}
      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-5 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive flex-1">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchHistorial}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando historial…</p>
        </div>
      )}

      {/* Tabs */}
      {!loading && !error && (
        <Tabs defaultValue="diagnosticos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="diagnosticos" className="gap-2">
              <Stethoscope className="w-4 h-4" />
              Diagnósticos
              {diagnosticos.length > 0 && (
                <span className="ml-1 text-xs bg-primary/20 text-primary rounded-full px-1.5 py-0.5 leading-none">
                  {diagnosticos.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="recetas" className="gap-2">
              <Pill className="w-4 h-4" />
              Recetas
              {recetas.length > 0 && (
                <span className="ml-1 text-xs bg-primary/20 text-primary rounded-full px-1.5 py-0.5 leading-none">
                  {recetas.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* TAB DIAGNÓSTICOS */}
          <TabsContent value="diagnosticos" className="mt-6">
            {diagnosticos.length === 0
              ? <EmptyState type="diagnosticos" />
              : (
                <div className="space-y-4">
                  {diagnosticos.map((d) => <DiagnosticoCard key={d.id} d={d} />)}
                </div>
              )
            }
          </TabsContent>

          {/* TAB RECETAS */}
          <TabsContent value="recetas" className="mt-6">
            {recetas.length === 0
              ? <EmptyState type="recetas" />
              : (
                <div className="space-y-4">
                  {recetas.map((r) => <RecetaCard key={r.id} r={r} />)}
                </div>
              )
            }
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default PatientHistorial;
