import { Button } from "@/components/ui/button";
import { Activity, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <Activity className="w-7 h-7 text-primary" />
          <span className="text-xl font-bold text-foreground tracking-tight">SIEHC</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#" className="hover:text-primary transition-colors">Inicio</a>
          <a href="#" className="hover:text-primary transition-colors">Funcionalidades</a>
          <a href="#" className="hover:text-primary transition-colors">Hospitales</a>
          <a href="#" className="hover:text-primary transition-colors">Contacto</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Iniciar Sesión</Link>
          </Button>

          <Button size="sm" asChild>
            <Link to="/register">Registrarse</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3">
          <a href="#" className="block text-sm text-muted-foreground hover:text-primary">Inicio</a>
          <a href="#" className="block text-sm text-muted-foreground hover:text-primary">Funcionalidades</a>
          <a href="#" className="block text-sm text-muted-foreground hover:text-primary">Hospitales</a>
          <a href="#" className="block text-sm text-muted-foreground hover:text-primary">Contacto</a>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" size="sm" className="flex-1">Iniciar Sesión</Button>
            <Button size="sm" className="flex-1">Registrarse</Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
