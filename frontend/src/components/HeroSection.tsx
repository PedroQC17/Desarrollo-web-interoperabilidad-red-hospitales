import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Clock, Users } from "lucide-react";
import heroImage from "@/assets/hero-network.png";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden pt-20 pb-16 lg:pt-28 lg:pb-24">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
              <Shield className="w-4 h-4" />
              Red Hospitalaria Integrada
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-foreground">
              Tu salud,{" "}
              <span className="text-primary">conectada</span>{" "}
              en toda la red
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              SIEHC integra hospitales, médicos y pacientes en un solo sistema. 
              Gestiona citas, expedientes clínicos y recetas médicas de forma segura y eficiente.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-base px-8 py-6 font-semibold">
                Comenzar ahora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-base px-8 py-6 font-semibold">
                Conocer más
              </Button>
            </div>

            {/* Quick stats */}
            <div className="flex gap-8 pt-4">
              {[
                { icon: Users, label: "Pacientes activos", value: "10,000+" },
                { icon: Clock, label: "Citas gestionadas", value: "50,000+" },
                { icon: Shield, label: "Datos protegidos", value: "100%" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right image */}
          <div className="relative animate-float hidden lg:block">
            <img
              src={heroImage}
              alt="Red de hospitales conectados digitalmente"
              className="w-full h-auto drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
