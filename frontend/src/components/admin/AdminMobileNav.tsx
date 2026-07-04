import { Activity, Building2, Users, BarChart3, Pill, Settings, Home, LogOut, Menu, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/lib/authContext";

const navItems = [
  { icon: Home, label: "Panel Principal", path: "/admin" },
  { icon: Building2, label: "Hospitales", path: "/admin/hospitales" },
  { icon: Users, label: "Usuarios", path: "/admin/usuarios" },
  { icon: Pill, label: "Ventas y Servicios", path: "/admin/ventas" },
  { icon: BarChart3, label: "Reportes", path: "/admin/reportes" },
  { icon: Settings, label: "Configuración", path: "/admin/configuracion" },
  { icon: User, label: "Mi Perfil", path: "/admin/perfil" },
];

const AdminMobileNav = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-background">
      <div className="flex items-center gap-2">
        <Activity className="w-6 h-6 text-primary" />
        <span className="font-bold text-foreground">SIEHC</span>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex items-center gap-2 px-6 h-16 border-b border-border">
            <Activity className="w-6 h-6 text-primary" />
            <span className="font-bold text-foreground">SIEHC</span>
          </div>
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground">{user?.nombre || "Administrador"}</p>
            <p className="text-xs text-muted-foreground">Administrador</p>
          </div>
          <nav className="px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-primary"
                      : "text-foreground/70 hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="px-3 py-4 border-t border-border mt-auto">
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};

export default AdminMobileNav;
