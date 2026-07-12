import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays, Clock, MapPin, Stethoscope,
  Loader2, AlertCircle, UserRound, RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
//  HELPER — soporta respuesta directa (array) o paginada ({ results: [] })
// ─────────────────────────────────────────────────────────────────────────────
const extractList = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as any).results))
    return (data as any).results as T[];
  return [];
};

// ─────────────────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Cita = {
  id: number;
  paciente_nombre: string;
  especialidad: string;
  categoria_servicio: string;
  hospital_nombre: string;
  estado: string;          // valor raw: "pendiente" | "confirmada" | "en_curso" | ...
  estado_display: string;  // label localizado del backend
  inicio: string;
  fin: string;
  tipo: string;
  tipo_display: string;
  nota: string;
};

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────

// Los estados que un médico necesita ver para atender citas
const FILTROS = [
  { key: "todas",      label: "Todas"       },
  { key: "pendiente",  label: "Pendiente"   },
  { key: "confirmada", label: "Confirmada"  },
  { key: "en_curso",   label: "En curso"    },
];

// Estilos de los badges de estado
const statusStyles: Record<string, string> = {
  pendiente:  "bg-yellow-100 text-yellow-700 border border-yellow-200",
  confirmada: "bg-blue-100 text-blue-700 border border-blue-200",
  en_curso:   "bg-green-100 text-green-700 border border-green-200",
  completada: "bg-gray-100 text-gray-600 border border-gray-200",
  cancelada:  "bg-red-100 text-red-600 border border-red-200",
};

// Estados desde los que el médico puede iniciar atención
const ESTADOS_ATENDIBLES = ["pendiente", "confirmada", "en_curso"];

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat("es-PE", {
      day: "2-digit", month: "short", year: "numeric",
    }).format(new Date(value));
  } catch { return "—"; }
};

const formatTime = (value: string) => {
  try {
    return new Intl.DateTimeFormat("es-PE", {
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(value));
  } catch { return "—"; }
};

const parseError = (error: any): string => {
  if (!error) return "Ocurrió un error inesperado.";
  if (typeof error === "string") return error;
  if (Array.isArray(error)) return error.join(" ");
  if (typeof error === "object") {
    const v = Object.values(error)[0];
    if (Array.isArray(v)) return v.join(" ");
    return (error.error || error.detail || String(v)) ?? "Error inesperado.";
  }
  return "Ocurrió un error inesperado.";
};

// ─────────────────────────────────────────────────────────────────────────────
//  COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

interface DoctorCitasProps {
  /** Callback al pulsar "Atender" — recibe la cita seleccionada */
  onAtender?: (cita: Cita) => void;
}

const DoctorCitas = ({ onAtender }: DoctorCitasProps) => {
  const [citas,         setCitas]         = useState<Cita[]>([]);
  const [filter,        setFilter]        = useState("todas");
  const [loading,       setLoading]       = useState(true);
  const [pageError,     setPageError]     = useState("");
  const [estadoLoading, setEstadoLoading] = useState<number | null>(null);
  const navigate = useNavigate();

  // ── Carga de citas ──────────────────────────────────────────────────────
  const loadCitas = async () => {
    setLoading(true);
    setPageError("");
    try {
      // Cargamos estados relevantes para la agenda médica
      const [pendientes, confirmadas, enCurso] = await Promise.all([
        api("/citas/mis-citas-medico/?estado=pendiente"),
        api("/citas/mis-citas-medico/?estado=confirmada"),
        api("/citas/mis-citas-medico/?estado=en_curso"),
      ]);
      const todas = [
        ...extractList<Cita>(pendientes),
        ...extractList<Cita>(confirmadas),
        ...extractList<Cita>(enCurso),
      ].sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
      setCitas(todas);
    } catch (err) {
      setPageError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCitas(); }, []);

  // ── Citas filtradas ─────────────────────────────────────────────────────
  const filtered = useMemo(
    () => filter === "todas" ? citas : citas.filter((c) => c.estado === filter),
    [citas, filter]
  );

  // ── Confirmar cita (pendiente → confirmada) ─────────────────────────────
  const handleConfirmar = async (cita: Cita) => {
    setEstadoLoading(cita.id);
    try {
      const res = await api(`/citas/${cita.id}/estado/`, {
        method: "PATCH",
        body: JSON.stringify({ estado: "confirmada" }),
      });
      setCitas((prev) =>
        prev.map((c) => (c.id === cita.id ? { ...c, ...res.cita } : c))
      );
    } catch (err) {
      setPageError(parseError(err));
    } finally {
      setEstadoLoading(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Citas Pendientes
          </h1>
          <p className="text-muted-foreground mt-1">
            Consulta y gestiona las citas asignadas a tu agenda.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 self-start sm:self-auto" onClick={loadCitas} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Error de página */}
      {pageError && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{pageError}</span>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {FILTROS.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.key !== "todas" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({citas.filter((c) => c.estado === f.key).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando citas…</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((cita) => (
            <Card
              key={cita.id}
              className="border-border hover:shadow-md transition-shadow"
            >
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                  {/* Icono + datos */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <UserRound className="w-6 h-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground leading-tight">
                        {cita.paciente_nombre || `Paciente #${cita.id}`}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5" />
                        {cita.categoria_servicio || cita.especialidad}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-0.5">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {formatDate(cita.inicio)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime(cita.inicio)}
                        </span>
                        {cita.hospital_nombre && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {cita.hospital_nombre}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Badge + acciones */}
                  <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    <Badge className={statusStyles[cita.estado] ?? "bg-muted text-muted-foreground"}>
                      {cita.estado_display || cita.estado}
                    </Badge>

                    {/* Confirmar: solo si está pendiente */}
                    {cita.estado === "pendiente" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={estadoLoading === cita.id}
                        onClick={() => handleConfirmar(cita)}
                      >
                        {estadoLoading === cita.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : null}
                        Confirmar
                      </Button>
                    )}

                    {/* Atender: citas atendibles */}
                    {ESTADOS_ATENDIBLES.includes(cita.estado) && (
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          if (onAtender) {
                            onAtender(cita);
                          } else {
                            navigate(`/medico/atencion/${cita.id}`);
                          }
                        }}
                      >
                        <Stethoscope className="w-4 h-4" />
                        Atender
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <CalendarDays className="w-7 h-7 text-primary/50" />
              </div>
              <p className="text-muted-foreground font-medium">
                No hay citas con este estado
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {filter === "todas"
                  ? "No tienes citas asignadas en este momento."
                  : `No tienes citas en estado "${filter}".`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DoctorCitas;
export type { Cita };
