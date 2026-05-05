import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Stethoscope, Plus, Calendar, User, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";

const recentDiagnoses = [
  { id: 1, date: "15 Abr 2026", patient: "Juan Pérez", diagnosis: "Hipertensión Arterial Esencial", notes: "PA 150/95. Ajuste de dosis de Losartán." },
  { id: 2, date: "14 Abr 2026", patient: "María Torres", diagnosis: "Taquicardia Supraventricular", notes: "FC 130 bpm. Solicitar Holter 24h." },
  { id: 3, date: "14 Abr 2026", patient: "Luis Ramos", diagnosis: "Insuficiencia Cardíaca Grado II", notes: "Disnea de esfuerzo. Agregar diurético." },
  { id: 4, date: "12 Abr 2026", patient: "Ana Castillo", diagnosis: "Soplo Cardíaco Funcional", notes: "Benigno, sin tratamiento. Control anual." },
  { id: 5, date: "10 Abr 2026", patient: "Pedro Vargas", diagnosis: "Fibrilación Auricular Paroxística", notes: "Iniciar anticoagulación oral." },
];

const DoctorDiagnosticos = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Diagnósticos</h1>
          <p className="text-muted-foreground mt-1">Registra y consulta diagnósticos vinculados al historial del paciente.</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Diagnóstico
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Diagnóstico</DialogTitle>
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
                <Label>Diagnóstico (CIE-10)</Label>
                <Input placeholder="Ej: Hipertensión Arterial Esencial — I10" />
              </div>
              <div className="space-y-2">
                <Label>Observaciones clínicas</Label>
                <Textarea placeholder="Describa los hallazgos, signos y síntomas relevantes..." rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button>Registrar Diagnóstico</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" />
            Diagnósticos Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentDiagnoses.map((d) => (
              <div key={d.id} className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-foreground">{d.diagnosis}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{d.patient}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{d.date}</span>
                  </div>
                  <p className="text-sm text-foreground/70 mt-1">{d.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorDiagnosticos;
