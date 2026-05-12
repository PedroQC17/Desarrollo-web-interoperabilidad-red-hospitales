import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Pill, BarChart3, TrendingUp, Activity, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/authContext";

const stats = [
  { label: "Hospitales en Red", value: "12", icon: Building2, color: "text-primary", trend: "+2 este mes" },
  { label: "Usuarios Activos", value: "3,482", icon: Users, color: "text-accent", trend: "+12% mensual" },
  { label: "Ventas del Mes", value: "S/ 84,520", icon: Pill, color: "text-green-600", trend: "+8% vs anterior" },
  { label: "Citas Atendidas", value: "1,256", icon: Activity, color: "text-orange-500", trend: "Esta semana" },
];

const quickActions = [
  { label: "Gestionar Hospitales", path: "/admin/hospitales", icon: Building2 },
  { label: "Administrar Usuarios", path: "/admin/usuarios", icon: Users },
  { label: "Ver Reportes", path: "/admin/reportes", icon: BarChart3 },
  { label: "Ventas y Servicios", path: "/admin/ventas", icon: Pill },
];

const recentActivity = [
  { action: "Nuevo hospital registrado", detail: "Hospital San Juan de Dios", time: "Hace 2h", type: "hospital" },
  { action: "Médico aprobado", detail: "Dr. Carlos García - Cardiología", time: "Hace 4h", type: "user" },
  { action: "Reporte mensual generado", detail: "Octubre 2025 - Ventas", time: "Hace 6h", type: "report" },
  { action: "Servicio actualizado", detail: "Tarifa de Consulta Externa", time: "Ayer", type: "service" },
  { action: "Usuario suspendido", detail: "Acceso revocado por inactividad", time: "Hace 2 días", type: "user" },
];

const topHospitals = [
  { name: "Hospital Nacional Loayza", patients: 542, growth: "+12%" },
  { name: "Hospital Almenara", patients: 478, growth: "+8%" },
  { name: "Hospital Rebagliati", patients: 421, growth: "+15%" },
  { name: "Hospital Cayetano Heredia", patients: 389, growth: "+6%" },
];

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">

      {/* Perfil */}
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-7 h-7 text-primary" />
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              <p className="text-xs text-primary mt-2">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start justify-between pb-4 border-b border-border last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {item.type === "hospital" && <Building2 className="w-4 h-4 text-primary" />}
                      {item.type === "user" && <Users className="w-4 h-4 text-primary" />}
                      {item.type === "report" && <BarChart3 className="w-4 h-4 text-primary" />}
                      {item.type === "service" && <Pill className="w-4 h-4 text-primary" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.action}</p>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
                </div>
              ))}
            </div>
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

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Hospitales con Mayor Actividad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topHospitals.map((h, i) => (
              <div key={i} className="flex items-center justify-between pb-4 border-b border-border last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    {i + 1}
                  </div>
                  <p className="text-sm font-medium text-foreground">{h.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{h.patients} pacientes</span>
                  <Badge variant="secondary" className="text-xs">{h.growth}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;