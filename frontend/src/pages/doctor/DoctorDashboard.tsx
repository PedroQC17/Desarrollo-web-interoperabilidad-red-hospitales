import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Stethoscope, Pill, Users, Clock, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/authContext";

const stats = [
  { label: "Citas Hoy", value: "6", icon: CalendarDays, color: "text-accent" },
  { label: "Pacientes Atendidos", value: "124", icon: Users, color: "text-primary" },
  { label: "Recetas Emitidas", value: "38", icon: Pill, color: "text-green-600" },
  { label: "Diagnósticos Hoy", value: "4", icon: Stethoscope, color: "text-orange-500" },
];

const quickActions = [
  { label: "Citas Pendientes", path: "/medico/citas", icon: CalendarDays },
  { label: "Registrar Diagnóstico", path: "/medico/diagnosticos", icon: Stethoscope },
  { label: "Emitir Receta", path: "/medico/recetas", icon: Pill },
  { label: "Medicamentos", path: "/medico/medicamentos", icon: Package },
];

const upcomingAppointments = [
  { patient: "Juan Pérez", time: "09:00", specialty: "Control Cardiológico", status: "En espera" },
  { patient: "María Torres", time: "09:30", specialty: "Evaluación Inicial", status: "En espera" },
  { patient: "Luis Ramos", time: "10:00", specialty: "Seguimiento", status: "Confirmada" },
  { patient: "Ana Castillo", time: "10:30", specialty: "Control Mensual", status: "Confirmada" },
  { patient: "Pedro Vargas", time: "11:00", specialty: "Consulta General", status: "Confirmada" },
];

const DoctorDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">

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
              Próximas Citas de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.map((apt, i) => (
                <div key={i} className="flex items-center justify-between pb-4 border-b border-border last:border-0 last:pb-0">
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
                    <Badge variant={apt.status === "En espera" ? "default" : "secondary"} className="text-xs">
                      {apt.status}
                    </Badge>
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

export default DoctorDashboard;