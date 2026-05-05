import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Download, Calendar, Pill, Stethoscope } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const diagnoses = [
  { id: 1, date: "10 Abr 2026", doctor: "Dr. García", specialty: "Cardiología", hospital: "Hospital Central", diagnosis: "Hipertensión Arterial Esencial", notes: "Se recomienda control mensual de presión arterial." },
  { id: 2, date: "15 Mar 2026", doctor: "Dra. López", specialty: "Medicina Interna", hospital: "Clínica San Marcos", diagnosis: "Dislipidemia Mixta", notes: "Dieta baja en grasas, ejercicio regular." },
  { id: 3, date: "02 Feb 2026", doctor: "Dr. Quispe", specialty: "Neumología", hospital: "Hospital Central", diagnosis: "Asma Bronquial Leve", notes: "Uso de inhalador de rescate según necesidad." },
  { id: 4, date: "20 Dic 2025", doctor: "Dr. García", specialty: "Cardiología", hospital: "Hospital Central", diagnosis: "Arritmia Sinusal Benigna", notes: "No requiere tratamiento, control anual." },
];

const prescriptions = [
  { id: 1, date: "10 Abr 2026", doctor: "Dr. García", medications: ["Losartán 50mg — 1 tableta/día", "Amlodipino 5mg — 1 tableta/día"], status: "Activa" },
  { id: 2, date: "15 Mar 2026", doctor: "Dra. López", medications: ["Atorvastatina 20mg — 1 tableta/noche"], status: "Activa" },
  { id: 3, date: "02 Feb 2026", doctor: "Dr. Quispe", medications: ["Salbutamol Inhalador — según necesidad"], status: "Activa" },
  { id: 4, date: "20 Dic 2025", doctor: "Dr. García", medications: ["Sin medicación"], status: "Finalizada" },
];

const PatientHistorial = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Historial Médico</h1>
          <p className="text-muted-foreground mt-1">Consulta tus diagnósticos y recetas médicas.</p>
        </div>
        <Button className="gap-2">
          <Upload className="w-4 h-4" />
          Subir Historial
        </Button>
      </div>

      <Tabs defaultValue="diagnosticos" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="diagnosticos" className="gap-2">
            <Stethoscope className="w-4 h-4" />
            Diagnósticos
          </TabsTrigger>
          <TabsTrigger value="recetas" className="gap-2">
            <Pill className="w-4 h-4" />
            Recetas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diagnosticos" className="mt-6 space-y-4">
          {diagnoses.map((d) => (
            <Card key={d.id} className="border-border">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{d.diagnosis}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{d.date}</span>
                      <span>{d.doctor} — {d.specialty}</span>
                      <span>{d.hospital}</span>
                    </div>
                    <p className="text-sm text-foreground/80 mt-2">{d.notes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="recetas" className="mt-6 space-y-4">
          {prescriptions.map((r) => (
            <Card key={r.id} className="border-border">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">Receta — {r.doctor}</h3>
                      <Badge variant={r.status === "Activa" ? "default" : "secondary"} className="text-xs">
                        {r.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />{r.date}
                    </p>
                    <ul className="space-y-1 mt-2">
                      {r.medications.map((med, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                          <Pill className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          {med}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5 flex-shrink-0">
                    <Download className="w-4 h-4" />
                    PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientHistorial;
