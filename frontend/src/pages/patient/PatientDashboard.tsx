import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, FileText, Receipt, ShieldCheck, Clock, Activity, User, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/authContext";
import { api } from "@/lib/api";

const quickActions = [
  { label: "Solicitar Cita", path: "/paciente/citas", icon: CalendarDays },
  { label: "Ver Historial", path: "/paciente/historial", icon: FileText },
  { label: "Consentimiento", path: "/paciente/consentimiento", icon: ShieldCheck },
  { label: "Facturación", path: "/paciente/facturacion", icon: Receipt },
];

const formatDate = (iso: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const extractList = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as any).results))
    return (data as any).results as T[];
  return [];
};

const PatientDashboard = () => {
  const { user } = useAuth();
  const [citas, setCitas] = useState<any[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<any[]>([]);
  const [recetas, setRecetas] = useState<any[]>([]);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [citasData, diagData, recData, facData] = await Promise.all([
          api("/citas/mis-citas/").catch(() => []),
          api("/historiales/mis-diagnosticos/").catch(() => []),
          api("/historiales/mis-recetas/").catch(() => []),
          api("/facturacion/").catch(() => []),
        ]);

        setCitas(extractList(citasData));
        setDiagnosticos(extractList(diagData));
        setRecetas(extractList(recData));
        setFacturas(extractList(facData));
      } catch (err) {
        console.error("Error cargando dashboard:", err);
        setError("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const stats = [
    { label: "Citas Pendientes", value: String(citas.length), icon: CalendarDays, color: "text-accent" },
    { label: "Diagnósticos", value: String(diagnosticos.length), icon: FileText, color: "text-primary" },
    { label: "Recetas Activas", value: String(recetas.length), icon: Activity, color: "text-green-600" },
    { label: "Facturas", value: String(facturas.length), icon: Receipt, color: "text-orange-500" },
  ];

  const recentActivity = [
    ...citas.slice(0, 2).map((c: any) => ({
      text: `Cita ${c.estado || "programada"} — ${c.especialidad || "General"}`,
      date: formatDate(c.fecha_hora || c.fecha || ""),
      type: "cita",
    })),
    ...recetas.slice(0, 2).map((r: any) => ({
      text: `Receta emitida: ${r.medicamento_nombre || "Medicamento"}`,
      date: formatDate(r.fecha_emitida || ""),
      type: "receta",
    })),
    ...diagnosticos.slice(0, 2).map((d: any) => ({
      text: `Diagnóstico: ${d.estado_clinico || "Registro"}`,
      date: formatDate(d.fecha_hora_inicio || ""),
      type: "diagnostico",
    })),
    ...facturas.slice(0, 1).map((f: any) => ({
      text: `Factura pagada — S/ ${f.monto_total || 0}`,
      date: formatDate(f.fecha_emision || ""),
      type: "factura",
    })),
  ].slice(0, 5);

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
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Bienvenido, {user?.nombre}
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
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay actividad reciente</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{item.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.date}</p>
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

export default PatientDashboard;