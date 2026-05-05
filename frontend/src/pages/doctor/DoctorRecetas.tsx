import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pill, Plus, Calendar, User, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";

const recentPrescriptions = [
  {
    id: 1, date: "15 Abr 2026", patient: "Juan Pérez", diagnosis: "Hipertensión Arterial",
    medications: ["Losartán 50mg — 1 tableta c/24h", "Amlodipino 5mg — 1 tableta c/24h"], status: "Emitida",
  },
  {
    id: 2, date: "14 Abr 2026", patient: "María Torres", diagnosis: "Taquicardia Supraventricular",
    medications: ["Propranolol 40mg — 1 tableta c/12h"], status: "Emitida",
  },
  {
    id: 3, date: "14 Abr 2026", patient: "Luis Ramos", diagnosis: "Insuficiencia Cardíaca",
    medications: ["Furosemida 40mg — 1 tableta c/24h", "Enalapril 10mg — 1 tableta c/12h", "Espironolactona 25mg — 1 tableta c/24h"], status: "Emitida",
  },
  {
    id: 4, date: "10 Abr 2026", patient: "Pedro Vargas", diagnosis: "Fibrilación Auricular",
    medications: ["Rivaroxabán 20mg — 1 tableta c/24h con alimentos"], status: "Despachada",
  },
];

const statusStyles: Record<string, string> = {
  Emitida: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Despachada: "bg-green-100 text-green-700 border-green-200",
};

const DoctorRecetas = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Recetas Médicas</h1>
          <p className="text-muted-foreground mt-1">Emite recetas vinculadas al diagnóstico del paciente.</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nueva Receta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Emitir Receta Médica</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Paciente</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Seleccionar paciente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="juan">Juan Pérez</SelectItem>
                    <SelectItem value="maria">María Torres</SelectItem>
                    <SelectItem value="luis">Luis Ramos</SelectItem>
                    <SelectItem value="ana">Ana Castillo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Diagnóstico asociado</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Seleccionar diagnóstico" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hta">Hipertensión Arterial Esencial</SelectItem>
                    <SelectItem value="tsv">Taquicardia Supraventricular</SelectItem>
                    <SelectItem value="ic">Insuficiencia Cardíaca</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Medicamentos (uno por línea)</Label>
                <Textarea placeholder={"Losartán 50mg — 1 tableta c/24h\nAmlodipino 5mg — 1 tableta c/24h"} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Indicaciones adicionales</Label>
                <Textarea placeholder="Instrucciones especiales, advertencias..." rows={2} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button>Emitir Receta</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {recentPrescriptions.map((r) => (
          <Card key={r.id} className="border-border">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Pill className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{r.patient}</h3>
                      <Badge className={statusStyles[r.status]}>{r.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />{r.date} — {r.diagnosis}
                    </p>
                    <ul className="space-y-1 mt-1">
                      {r.medications.map((med, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          {med}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 flex-shrink-0">
                  <Download className="w-4 h-4" />
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DoctorRecetas;
