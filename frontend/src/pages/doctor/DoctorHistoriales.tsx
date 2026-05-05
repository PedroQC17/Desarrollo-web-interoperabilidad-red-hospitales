import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Search, User, Calendar, Eye } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const patients = [
  {
    id: 1, name: "Juan Pérez", age: 45, dni: "45678901", lastVisit: "10 Abr 2026",
    diagnoses: [
      { date: "10 Abr 2026", diagnosis: "Hipertensión Arterial Esencial", notes: "Control mensual de presión arterial." },
      { date: "20 Dic 2025", diagnosis: "Arritmia Sinusal Benigna", notes: "No requiere tratamiento." },
    ],
    prescriptions: ["Losartán 50mg — 1/día", "Amlodipino 5mg — 1/día"],
  },
  {
    id: 2, name: "María Torres", age: 32, dni: "32145678", lastVisit: "08 Abr 2026",
    diagnoses: [
      { date: "08 Abr 2026", diagnosis: "Taquicardia Supraventricular", notes: "Evaluación con Holter." },
    ],
    prescriptions: ["Propranolol 40mg — 2/día"],
  },
  {
    id: 3, name: "Luis Ramos", age: 58, dni: "12345678", lastVisit: "05 Abr 2026",
    diagnoses: [
      { date: "05 Abr 2026", diagnosis: "Insuficiencia Cardíaca Grado II", notes: "Restricción de sodio, diuréticos." },
      { date: "10 Ene 2026", diagnosis: "Hipertensión Arterial", notes: "Ajuste de medicación." },
    ],
    prescriptions: ["Furosemida 40mg — 1/día", "Enalapril 10mg — 2/día"],
  },
  {
    id: 4, name: "Ana Castillo", age: 27, dni: "87654321", lastVisit: "01 Abr 2026",
    diagnoses: [
      { date: "01 Abr 2026", diagnosis: "Soplo Cardíaco Funcional", notes: "Benigno, control anual." },
    ],
    prescriptions: [],
  },
];

const DoctorHistoriales = () => {
  const [search, setSearch] = useState("");
  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.dni.includes(search)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Historiales de Pacientes</h1>
        <p className="text-muted-foreground mt-1">Consulta el historial clínico de tus pacientes atendidos.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o DNI..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-4">
        {filtered.map((patient) => (
          <Card key={patient.id} className="border-border">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground">{patient.name} <span className="text-muted-foreground font-normal text-sm">({patient.age} años)</span></h3>
                    <p className="text-xs text-muted-foreground">DNI: {patient.dni}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      Última visita: {patient.lastVisit}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{patient.diagnoses.length} diagnóstico(s)</Badge>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Eye className="w-4 h-4" />
                        Ver Historial
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Historial — {patient.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" /> Diagnósticos
                          </h4>
                          <div className="space-y-3">
                            {patient.diagnoses.map((d, i) => (
                              <div key={i} className="p-3 rounded-lg border border-border bg-secondary/30">
                                <p className="text-sm font-medium text-foreground">{d.diagnosis}</p>
                                <p className="text-xs text-muted-foreground mt-1">{d.date} — {d.notes}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        {patient.prescriptions.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-primary" /> Medicación Actual
                            </h4>
                            <ul className="space-y-1">
                              {patient.prescriptions.map((med, i) => (
                                <li key={i} className="text-sm text-foreground/80 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                  {med}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No se encontraron pacientes.</div>
        )}
      </div>
    </div>
  );
};

export default DoctorHistoriales;
