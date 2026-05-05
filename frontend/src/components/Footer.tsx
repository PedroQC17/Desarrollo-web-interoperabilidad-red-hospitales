import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-bold text-foreground mb-2">SIEHC</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sistema de Integración de Expedientes Hospitalarios Clínicos. 
              Conectando la red de salud para un mejor servicio.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Sistema</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-primary cursor-pointer transition-colors">Iniciar Sesión</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Registrarse</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Hospitales</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Soporte</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-primary cursor-pointer transition-colors">Política de Privacidad</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Términos de Uso</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Consentimiento de Datos</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 SIEHC. Todos los derechos reservados.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Hecho con <Heart className="w-4 h-4 text-primary" /> para la salud
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
