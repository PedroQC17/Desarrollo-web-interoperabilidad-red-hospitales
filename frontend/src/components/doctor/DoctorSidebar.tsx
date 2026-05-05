import { Activity, CalendarDays, Stethoscope, Pill, FileText, Package, Home, LogOut, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Panel Principal", path: "/medico" },
  { icon: CalendarDays, label: "Citas Pendientes", path: "/medico/citas" },
  { icon: FileText, label: "Historiales", path: "/medico/historiales" },
  { icon: Stethoscope, label: "Diagnósticos", path: "/medico/diagnosticos" },
  { icon: Pill, label: "Recetas", path: "/medico/recetas" },
  { icon: Package, label: "Medicamentos", path: "/medico/medicamentos" },
];

const DoctorSidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-sidebar-background min-h-screen">
      <div className="flex items-center gap-2 px-6 h-16 border-b border-sidebar-border">
        <Activity className="w-7 h-7 text-sidebar-primary" />
        <span className="text-xl font-bold text-sidebar-foreground tracking-tight">SIEHC</span>
      </div>

      <div className="px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-sidebar-foreground">Dr. Carlos García</p>
            <p className="text-xs text-muted-foreground">Cardiólogo</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </Link>
      </div>
    </aside>
  );
};

export default DoctorSidebar;
