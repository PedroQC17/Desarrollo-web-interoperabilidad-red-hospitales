import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, User, CheckCircle, Stethoscope } from "lucide-react";
import { useState } from "react";

const appointments = [
  { id: 1, date: "15 Abr 2026", time: "09:00", patient: "Juan Pérez", age: 45, reason: "Control Cardiológico", hospital: "Hospital Central", status: "En espera" },
  { id: 2, date: "15 Abr 2026", time: "09:30", patient: "María Torres", age: 32, reason: "Evaluación Inicial", hospital: "Hospital Central", status: "En espera" },
  { id: 3, date: "15 Abr 2026", time: "10:00", patient: "Luis Ramos", age: 58, reason: "Seguimiento Hipertensión", hospital: "Hospital Central", status: "Confirmada" },
  { id: 4, date: "15 Abr 2026", time: "10:30", patient: "Ana Castillo", age: 27, reason: "Control Mensual", hospital: "Clínica San Marcos", status: "Confirmada" },
  { id: 5, date: "16 Abr 2026", time: "09:00", patient: "Pedro Vargas", age: 61, reason: "Consulta General", hospital: "Hospital Central", status: "Confirmada" },
  { id: 6, date: "16 Abr 2026", time: "11:00", patient: "Rosa Medina", age: 39, reason: "Dolor Torácico", hospital: "Clínica Lima Norte", status: "Pendiente" },
];

const statusStyles: Record<string, string> = {
  "En espera": "bg-yellow-100 text-yellow-700 border-yellow-200",
  Confirmada: "bg-green-100 text-green-700 border-green-200",
  Pendiente: "bg-secondary text-secondary-foreground",
  Atendida: "bg-primary/10 text-primary",
};

const DoctorCitas = () => {
  const [filter, setFilter] = useState("todas");
  const filtered = filter === "todas" ? appointments : appointments.filter(a => a.status.toLowerCase().replace(" ", "") === filter);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Citas Pendientes</h1>
        <p className="text-muted-foreground mt-1">Consulta y gestiona las citas asignadas a tu agenda.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["todas", "enespera", "confirmada", "pendiente"].map((f) => {
          const labels: Record<string, string> = { todas: "Todas", enespera: "En espera", confirmada: "Confirmada", pendiente: "Pendiente" };
          return (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
              {labels[f]}
            </Button>
          );
        })}
      </div>

      <div className="space-y-4">
        {filtered.map((apt) => (
          <Card key={apt.id} className="border-border">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground">{apt.patient} <span className="text-muted-foreground font-normal text-sm">({apt.age} años)</span></h3>
                    <p className="text-sm text-foreground/80">{apt.reason}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{apt.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{apt.time}</span>
                      <span>{apt.hospital}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={statusStyles[apt.status]}>{apt.status}</Badge>
                  {(apt.status === "En espera" || apt.status === "Confirmada") && (
                    <Button size="sm" className="gap-1.5">
                      <Stethoscope className="w-4 h-4" />
                      Atender
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No hay citas con este estado.</div>
        )}
      </div>
    </div>
  );
};

export default DoctorCitas;
