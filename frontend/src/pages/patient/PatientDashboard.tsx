import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, FileText, Receipt, ShieldCheck, Clock, Activity, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/authContext";

const stats = [
  { label: "Citas Pendientes", value: "3", icon: CalendarDays, color: "text-accent" },
  { label: "Diagnósticos", value: "12", icon: FileText, color: "text-primary" },
  { label: "Recetas Activas", value: "5", icon: Activity, color: "text-green-600" },
  { label: "Facturas", value: "8", icon: Receipt, color: "text-orange-500" },
];

const quickActions = [
  { label: "Solicitar Cita", path: "/paciente/citas", icon: CalendarDays },
  { label: "Ver Historial", path: "/paciente/historial", icon: FileText },
  { label: "Consentimiento", path: "/paciente/consentimiento", icon: ShieldCheck },
  { label: "Facturación", path: "/paciente/facturacion", icon: Receipt },
];

const recentActivity = [
  { text: "Cita confirmada con Dr. García — Cardiología", date: "15 Abr 2026", type: "cita" },
  { text: "Receta emitida: Losartán 50mg", date: "10 Abr 2026", type: "receta" },
  { text: "Diagnóstico registrado: Hipertensión Arterial", date: "10 Abr 2026", type: "diagnostico" },
  { text: "Factura #1082 pagada — S/ 150.00", date: "08 Abr 2026", type: "factura" },
  { text: "Consentimiento actualizado", date: "01 Abr 2026", type: "consentimiento" },
];

const PatientDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">

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

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
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