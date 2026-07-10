import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Stethoscope, Pill, Users, Clock, Package, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/authContext";
import { api } from "@/lib/api";

const quickActions = [
  { label: "Citas Pendientes", path: "/medico/citas", icon: CalendarDays },
  { label: "Registrar Diagnóstico", path: "/medico/diagnosticos", icon: Stethoscope },
  { label: "Emitir Receta", path: "/medico/recetas", icon: Pill },
  { label: "Medicamentos", path: "/medico/medicamentos", icon: Package },
];

const extractList = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as any).results))
    return (data as any).results as T[];
  return [];
};

// Estados que se consideran "por atender" (pendiente de confirmación o acción)
const ESTADOS_PENDIENTES = ["pendiente", "en_espera", "solicitada", "scheduled"];

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [citas, setCitas] = useState<any[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<any[]>([]);
  const [recetas, setRecetas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [citasData, diagData, recData] = await Promise.all([
          api("/citas/mis-citas-medico/").catch(() => []),
          // ✅ Endpoints corregidos — los del router de historial
          api("/historiales/diagnosticos/").catch(() => []),
          api("/historiales/recetas/").catch(() => []),
        ]);

        setCitas(extractList(citasData));
        setDiagnosticos(extractList(diagData));
        setRecetas(extractList(recData));
      } catch (err) {
        console.error("Error cargando dashboard:", err);
        setError("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // ✅ "inicio" es el campo correcto según el serializer de Cita
  const hoy = new Date().toDateString();

  const citasPorAtender = citas.filter((c: any) =>
    ESTADOS_PENDIENTES.includes((c.estado ?? "").toLowerCase())
  );

  const stats = [
    {
      label: "Citas por Atender",           // ✅ renombrado
      value: String(citasPorAtender.length), // ✅ cuenta pendientes, no "hoy"
      icon: CalendarDays,
      color: "text-accent",
    },
    {
      label: "Pacientes Atendidos",
      // paciente_nombre existe en el serializer de lectura
      value: String(new Set(citas.map((c: any) => c.paciente_id)).size),
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Recetas Emitidas",
      value: String(recetas.length),
      icon: Pill,
      color: "text-green-600",
    },
    {
      label: "Diagnósticos Hoy",
      // ✅ campo correcto: "fecha_diagnostico" o "created_at" — ajusta si difiere
      value: String(
        diagnosticos.filter((d: any) => {
          const fecha = d.fecha_hora_inicio;
          return fecha && new Date(fecha).toDateString() === hoy;
        }).length
      ),
      icon: Stethoscope,
      color: "text-orange-500",
    },
  ];

  // ✅ campo correcto: "inicio" y "fin" según CitaLecturaSerializer
  const upcomingAppointments = citas.slice(0, 5).map((apt: any) => ({
    patient: apt.paciente_nombre || "Paciente",
    time: apt.inicio
      ? new Date(apt.inicio).toLocaleTimeString("es-PE", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—",
    specialty: apt.especialidad || apt.medico_especialidad || "General",
    status: apt.estado_display || apt.estado || "En espera",
    esPendiente: ESTADOS_PENDIENTES.includes((apt.estado ?? "").toLowerCase()),
  }));

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Perfil */}
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Bienvenido, Dr. {user?.nombre}
              </h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
                {user?.tipo_usuario}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Próximas Citas de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay citas pendientes</p>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((apt, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between pb-4 border-b border-border last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{apt.patient}</p>
                        <p className="text-xs text-muted-foreground">{apt.specialty}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{apt.time}</span>
                      {/* ✅ badge refleja estado real */}
                      <Badge
                        variant={apt.esPendiente ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {apt.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.path}
                  to={action.path}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors text-center"
                >
                  <action.icon className="w-6 h-6 text-primary" />
                  <span className="text-xs font-medium text-foreground">{action.label}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorDashboard;