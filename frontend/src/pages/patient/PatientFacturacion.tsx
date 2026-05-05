import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt, Download, Calendar, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const invoices = [
  { id: "FAC-1082", date: "10 Abr 2026", hospital: "Hospital Central", services: "Consulta Cardiología", medications: "Losartán 50mg, Amlodipino 5mg", total: "S/ 150.00", status: "Pagada" },
  { id: "FAC-1065", date: "15 Mar 2026", hospital: "Clínica San Marcos", services: "Consulta Medicina Interna", medications: "Atorvastatina 20mg", total: "S/ 120.00", status: "Pagada" },
  { id: "FAC-1041", date: "02 Feb 2026", hospital: "Hospital Central", services: "Consulta Neumología + Espirometría", medications: "Salbutamol Inhalador", total: "S/ 230.00", status: "Pagada" },
  { id: "FAC-1020", date: "20 Dic 2025", hospital: "Hospital Central", services: "Consulta Cardiología + Electrocardiograma", medications: "—", total: "S/ 180.00", status: "Pagada" },
  { id: "FAC-1090", date: "18 Abr 2026", hospital: "Hospital Central", services: "Consulta Cardiología (próxima)", medications: "—", total: "S/ 100.00", status: "Pendiente" },
];

const PatientFacturacion = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Facturación</h1>
        <p className="text-muted-foreground mt-1">Consulta y descarga tus comprobantes de pago.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-3 flex-1">
          <Input type="date" className="max-w-[180px]" />
          <Input type="date" className="max-w-[180px]" />
        </div>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo de gasto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="consulta">Consultas</SelectItem>
            <SelectItem value="medicamento">Medicamentos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">S/ 780.00</p>
            <p className="text-xs text-muted-foreground mt-1">Total Pagado</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">S/ 100.00</p>
            <p className="text-xs text-muted-foreground mt-1">Pendiente</p>
          </CardContent>
        </Card>
        <Card className="border-border hidden md:block">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">5</p>
            <p className="text-xs text-muted-foreground mt-1">Facturas</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice list */}
      <div className="space-y-4">
        {invoices.map((inv) => (
          <Card key={inv.id} className="border-border">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Receipt className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{inv.id}</h3>
                      <Badge variant={inv.status === "Pagada" ? "default" : "secondary"} className="text-xs">{inv.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />{inv.date} — {inv.hospital}
                    </p>
                    <p className="text-sm text-foreground/80">{inv.services}</p>
                    {inv.medications !== "—" && (
                      <p className="text-xs text-muted-foreground">Medicamentos: {inv.medications}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                  <span className="font-bold text-foreground text-lg">{inv.total}</span>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Download className="w-4 h-4" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PatientFacturacion;
