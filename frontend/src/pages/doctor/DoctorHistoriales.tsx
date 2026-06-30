import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Search,
  User,
  Calendar,
  Eye,
  Loader2,
  PlayCircle,
  CheckCircle2,
  Download,
} from "lucide-react";
import config from "@/config/env";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Diagnostico {
  id: number;
  estado_clinico: string;
  fecha_hora_inicio: string;
  descripcion_inicio: string;
  severidad: string;
}

interface Receta {
  id: number;
  medicamento: { nombre: string };
  instruccion_dosis: string;
  periodo_dosis: string;
}

interface Cita {
  id: number;

  paciente: number;
  paciente_nombre: string;

  especialidad: string;
  inicio: string;
  estado: string;
}

const DoctorHistoriales = () => {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [historialData, setHistorialData] = useState<
    Record<number, { diagnosticos: Diagnostico[]; recetas: Receta[] }>
  >({});
  const [loading, setLoading] = useState(false);
  const [loadingHistorial, setLoadingHistorial] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchCitas = async () => {
    setLoading(true);

    try {
      const data = await api("/citas/mis-citas-medico/");
      setCitas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setCitas([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistorial = async (citaId: number) => {
    if (historialData[citaId]) {
      return;
    }
    setLoadingHistorial(citaId);

    try {
      const data = await api(`/citas/${citaId}/paciente/`);

      setHistorialData((prev) => ({
        ...prev,
        [citaId]: data?.historial || {
          diagnosticos: [],
          recetas: [],
        },
      }));
    } catch (err) {
      console.error(err);

      setHistorialData((prev) => ({
        ...prev,
        [citaId]: {
          diagnosticos: [],
          recetas: [],
        },
      }));
    } finally {
      setLoadingHistorial(null);
    }
  };

  const handleAtender = async (cita: Cita) => {
    try {
      let citaId = cita.id;

      // Si la cita de la lista no es activa (pendiente, confirmada o en curso), buscamos una activa
      if (!["pendiente", "confirmada", "en_curso"].includes(cita.estado)) {
        const activeCitas = await api(`/citas/medico/activas/?paciente_id=${cita.paciente}`);
        const activeCita = Array.isArray(activeCitas) ? activeCitas[0] : null;
        if (!activeCita) {
          alert("El paciente no tiene una cita activa (pendiente, confirmada o en curso) asignada a usted.");
          return;
        }
        citaId = activeCita.id;
      }

      navigate(`/medico/atencion/${citaId}`);
    } catch (err) {
      console.error(err);
      alert("Error al obtener la cita activa del paciente.");
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

  useEffect(() => {
    fetchCitas();
  }, []);

  const filteredCitas = citas.filter((c) => {
    const name = c.paciente_nombre?.toLowerCase() || "";
    const query = search.toLowerCase();

    return name.includes(query);
  });

  const pacientesPor = new Map<string, Cita>();

  filteredCitas.forEach((cita) => {
    const key = String(cita.paciente);

    if (!pacientesPor.has(key)) {
      pacientesPor.set(key, cita);
    }
  });

  const pacientes = Array.from(pacientesPor.values());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Historiales de Pacientes
        </h1>

        <p className="text-muted-foreground mt-1">
          Consulta el historial clínico de tus pacientes atendidos.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />

            <span className="text-muted-foreground">
              Cargando historiales...
            </span>
          </div>
        ) : pacientes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {search
              ? "No se encontraron pacientes."
              : "No hay historiales disponibles."}
          </div>
        ) : (
          pacientes.map((cita) => {
            const hdata = historialData[cita.id];

            return (
              <Card
                key={`${cita.paciente}-${cita.id}`}
                className="border-border"
              >
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-primary" />
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-semibold text-foreground">
                          {cita.paciente_nombre}
                        </h3>

                        <p className="text-xs text-muted-foreground">
                          ID Paciente: {cita.paciente}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />

                          Última cita:{" "}
                          {new Date(cita.inicio).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">
                        {hdata ? hdata.diagnosticos.length : "—"} diagnóstico(s)
                      </Badge>

                      {cita.estado === "confirmada" ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Atendido
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          className="gap-1.5"
                          onClick={() => handleAtender(cita)}
                        >
                          <PlayCircle className="w-4 h-4" />
                          {cita.estado === "en_curso"
                            ? "Continuar"
                            : "Atender"}
                        </Button>
                      )}

                      <Dialog
                        onOpenChange={(open) => {
                          if (open && !hdata) {
                            fetchHistorial(cita.id);
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                          >
                            <Eye className="w-4 h-4" />
                            Ver Historial
                          </Button>
                        </DialogTrigger>

                        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              Historial — {cita.paciente_nombre}
                            </DialogTitle>
                          </DialogHeader>

                          {loadingHistorial === cita.id ? (
                            <div className="flex items-center justify-center py-8 gap-2">
                              <Loader2 className="w-5 h-5 animate-spin text-primary" />

                              <span className="text-muted-foreground">
                                Cargando historial...
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-6 py-4">
                              <div>
                                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-primary" />
                                  Diagnósticos
                                </h4>

                                <div className="space-y-3">
                                  {hdata?.diagnosticos &&
                                  hdata.diagnosticos.length > 0 ? (
                                    hdata.diagnosticos.map((d) => (
                                      <div
                                        key={d.id}
                                        className="p-3 rounded-lg border border-border bg-secondary/30"
                                      >
                                        <p className="text-sm font-medium text-foreground">
                                          {d.estado_clinico}
                                        </p>

                                        <p className="text-xs text-muted-foreground mt-1">
                                          {new Date(
                                            d.fecha_hora_inicio
                                          ).toLocaleDateString()}
                                        </p>

                                        <p className="text-xs text-foreground/70 mt-2">
                                          {d.descripcion_inicio}
                                        </p>

                                        <Badge className="mt-2 text-xs">
                                          {d.severidad}
                                        </Badge>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-muted-foreground">
                                      No hay diagnósticos registrados
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-primary" />
                                  Recetas
                                </h4>

                                <div className="space-y-3">
                                  {hdata?.recetas &&
                                  hdata.recetas.length > 0 ? (
                                    hdata.recetas.map((r) => (
                                      <div
                                        key={r.id}
                                        className="p-3 rounded-lg border border-border bg-secondary/30"
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div>
                                            <p className="text-sm font-medium text-foreground">
                                              {r.medicamento.nombre}
                                            </p>
                                            <p className="text-xs text-foreground/70 mt-1">
                                              <strong>Dosis:</strong>{" "}
                                              {r.instruccion_dosis}
                                            </p>
                                            <p className="text-xs text-foreground/70">
                                              <strong>Período:</strong>{" "}
                                              {r.periodo_dosis}
                                            </p>
                                          </div>
                                          <Button variant="ghost" size="sm" onClick={() => descargarPDF(r.id)} className="h-6 w-6 p-0 flex-shrink-0">
                                            <Download className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-muted-foreground">
                                      No hay recetas registradas
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DoctorHistoriales;