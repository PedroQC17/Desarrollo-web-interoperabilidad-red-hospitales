import { Activity, FileText, CalendarDays, ShieldCheck, Receipt, MessageCircle, Home, Menu, X, LogOut, User, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/lib/authContext";

const navItems = [
  { icon: Home, label: "Panel Principal", path: "/paciente" },
  { icon: FileText, label: "Historial Médico", path: "/paciente/historial" },
  { icon: CalendarDays, label: "Citas Médicas", path: "/paciente/citas" },
  { icon: ShieldCheck, label: "Consentimiento", path: "/paciente/consentimiento" },
  { icon: Receipt, label: "Facturación", path: "/paciente/facturacion" },
  { icon: MessageCircle, label: "Soporte", path: "/paciente/soporte" },
  { icon: Settings, label: "Mi Perfil", path: "/paciente/perfil" },
];

const PatientMobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between h-14 px-4 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          <span className="text-lg font-bold text-foreground">SIEHC</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-foreground">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background pt-14">
          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{user?.nombre || "Paciente"}</p>
                <p className="text-xs text-muted-foreground">Paciente</p>
              </div>
            </div>
          </div>
          <nav className="px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive ? "bg-secondary text-primary" : "text-foreground/70 hover:bg-muted"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="px-3 py-4 border-t border-border">
            <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientMobileNav;
