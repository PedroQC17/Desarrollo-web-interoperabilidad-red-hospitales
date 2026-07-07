import {
  CalendarCheck,
  FileText,
  Stethoscope,
  Pill,
  ShieldCheck,
  Bell,
} from "lucide-react";

const features = [
  {
    icon: CalendarCheck,
    title: "Gestión de Citas",
    description: "Agenda citas médicas en cualquier hospital de la red, selecciona especialidad y médico disponible.",
  },
  {
    icon: FileText,
    title: "Historial Clínico",
    description: "Accede a tu expediente médico completo con diagnósticos, tratamientos y recetas en un solo lugar.",
  },
  {
    icon: Stethoscope,
    title: "Atención Médica",
    description: "Los médicos consultan el historial del paciente y registran diagnósticos durante la atención.",
  },
  {
    icon: Pill,
    title: "Recetas Digitales",
    description: "Emisión y consulta de recetas médicas vinculadas al historial del paciente automáticamente.",
  },
  {
    icon: ShieldCheck,
    title: "Consentimiento Seguro",
    description: "Control total sobre tus datos médicos con consentimiento informado revocable en cualquier momento.",
  },
  {
    icon: Bell,
    title: "Notificaciones",
    description: "Recibe alertas sobre tus citas, resultados médicos y actualizaciones importantes de tu salud.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Funcionalidades
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Todo lo que necesitas en un solo sistema
          </h2>
          <p className="text-muted-foreground text-lg">
            SIEHC centraliza la gestión hospitalaria para pacientes, médicos y administradores.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-[var(--card-hover-shadow)] hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-secondary text-primary">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
