import { User, Stethoscope, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const roles = [
  {
    icon: User,
    title: "Paciente",
    description: "Registra tu historial médico, agenda citas en la red hospitalaria, consulta diagnósticos y recetas.",
    actions: ["Crear historial médico", "Solicitar citas", "Consultar recetas", "Gestionar consentimiento"],
  },
  {
    icon: Stethoscope,
    title: "Médico",
    description: "Atiende citas, consulta historiales de pacientes, emite diagnósticos y genera recetas médicas.",
    actions: ["Ver citas pendientes", "Registrar diagnósticos", "Emitir recetas", "Acceder historiales"],
  },
  {
    icon: Settings,
    title: "Administrador",
    description: "Gestiona hospitales, usuarios y la configuración general de la red de servicios de salud.",
    actions: ["Gestionar hospitales", "Administrar usuarios", "Configurar red", "Generar reportes"],
  },
];

const RolesSection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Roles del Sistema
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Un acceso para cada necesidad
          </h2>
          <p className="text-muted-foreground text-lg">
            Cada usuario tiene funcionalidades diseñadas específicamente para su rol dentro de la red.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {roles.map((role) => (
            <div
              key={role.title}
              className="relative rounded-2xl border border-border bg-card p-8 flex flex-col transition-all duration-300 hover:shadow-[var(--card-hover-shadow)]"
            >
              <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary text-primary-foreground">
                <role.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{role.title}</h3>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{role.description}</p>
              <ul className="space-y-2 mb-8 flex-1">
                {role.actions.map((action) => (
                  <li key={action} className="flex items-center gap-2 text-sm text-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full mt-auto" asChild>
                <Link to={role.title === "Paciente" ? "/paciente" : role.title === "Médico" ? "/medico" : "/admin"}>
                  Acceder como {role.title}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RolesSection;
