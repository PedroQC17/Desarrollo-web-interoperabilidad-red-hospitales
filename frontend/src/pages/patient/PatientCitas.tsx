import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CalendarDays, Plus, Clock, MapPin, User, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const appointments = [
  { id: 1, date: "18 Abr 2026", time: "09:00", doctor: "Dr. García", specialty: "Cardiología", hospital: "Hospital Central", status: "Confirmada" },
  { id: 2, date: "22 Abr 2026", time: "11:30", doctor: "Dra. López", specialty: "Medicina Interna", hospital: "Clínica San Marcos", status: "Pendiente" },
  { id: 3, date: "25 Abr 2026", time: "15:00", doctor: "Dr. Quispe", specialty: "Neumología", hospital: "Hospital Central", status: "Confirmada" },
  { id: 4, date: "10 Mar 2026", time: "10:00", doctor: "Dr. García", specialty: "Cardiología", hospital: "Hospital Central", status: "Completada" },
  { id: 5, date: "15 Feb 2026", time: "14:00", doctor: "Dra. Rojas", specialty: "Dermatología", hospital: "Clínica Lima Norte", status: "Cancelada" },
];

const statusStyles: Record<string, string> = {
  Confirmada: "bg-green-100 text-green-700 border-green-200",
  Pendiente: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Completada: "bg-secondary text-secondary-foreground",
  Cancelada: "bg-destructive/10 text-destructive",
};

const PatientCitas = () => {
  const [filter, setFilter] = useState("todas");
  const filtered = filter === "todas" ? appointments : appointments.filter(a => a.status.toLowerCase() === filter);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Citas Médicas</h1>
          <p className="text-muted-foreground mt-1">Solicita, consulta y gestiona tus citas.</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Solicitar Cita
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Solicitar Nueva Cita</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Hospital</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Seleccionar hospital" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="central">Hospital Central</SelectItem>
                    <SelectItem value="sanmarcos">Clínica San Marcos</SelectItem>
                    <SelectItem value="limanorte">Clínica Lima Norte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Especialidad</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Seleccionar especialidad" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cardio">Cardiología</SelectItem>
                    <SelectItem value="interna">Medicina Interna</SelectItem>
                    <SelectItem value="neumo">Neumología</SelectItem>
                    <SelectItem value="derma">Dermatología</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Médico</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Seleccionar médico" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="garcia">Dr. García</SelectItem>
                    <SelectItem value="lopez">Dra. López</SelectItem>
                    <SelectItem value="quispe">Dr. Quispe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha preferida</Label>
                <Input type="date" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button>Confirmar Cita</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["todas", "confirmada", "pendiente", "completada", "cancelada"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        {filtered.map((apt) => (
          <Card key={apt.id} className="border-border">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground">{apt.doctor} — {apt.specialty}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{apt.date} a las {apt.time}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{apt.hospital}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={statusStyles[apt.status]}>{apt.status}</Badge>
                  {(apt.status === "Confirmada" || apt.status === "Pendiente") && (
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1">
                      <X className="w-4 h-4" />
                      Cancelar
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

export default PatientCitas;
