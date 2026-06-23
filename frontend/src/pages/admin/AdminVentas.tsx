import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pill, Stethoscope, TrendingUp, DollarSign, Loader2, Building2, User } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { toast } from "sonner";

// ── Tipos ────────────────────────────────────────────────────────────────────
interface VentaPorHospital {
  "despacho__cita__medico__usuario__medico__hospital__id": number;
  "despacho__cita__medico__usuario__medico__hospital__nombre": string;
  total_ingresos: string;
  total_ventas: number;
}

interface MasVendido {
  medicamento__nombre: string;
  medicamento__tipo: string;
  total_vendido: number;
  total_ingresos: string;
}

interface ReporteVentas {
  por_hospital: VentaPorHospital[];
  mas_vendidos: MasVendido[];
}

interface ServicioPorHospital {
  "medico__hospital__id": number;
  "medico__hospital__nombre": string;
  total_ingresos: string;
  total_atenciones: number;
}

interface ServicioPorTipo {
  categoria_servicio: string;
  total_ingresos: string;
  total_atenciones: number;
}

interface ServicioPorMedico {
  "medico__usuario__nombre": string;
  "medico__especialidad": string;
  "medico__hospital__nombre": string;
  total_ingresos: string;
  total_atenciones: number;
}

interface ReporteServicios {
  por_hospital: ServicioPorHospital[];
  por_servicio: ServicioPorTipo[];
  por_medico: ServicioPorMedico[];
  totales: { total_ingresos: string; total_atenciones: number };
}

const AdminVentas = () => {
  const [reporteVentas, setReporteVentas] = useState<ReporteVentas | null>(null);
  const [reporteServicios, setReporteServicios] = useState<ReporteServicios | null>(null);
  const [loadingVentas, setLoadingVentas] = useState(false);
  const [loadingServicios, setLoadingServicios] = useState(false);

  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");

  const cargarVentas = async () => {
    setLoadingVentas(true);
    try {
      const params = new URLSearchParams();
      if (filtroDesde) params.append("desde", filtroDesde);
      if (filtroHasta) params.append("hasta", filtroHasta);
      const qs = params.toString() ? `?${params.toString()}` : "";
      const data = await api(`/medicamentos/reporte-ventas/${qs}`);
      setReporteVentas(data);
    } catch {
      toast.error("Error al cargar reporte de ventas");
    } finally {
      setLoadingVentas(false);
    }
  };

  const cargarServicios = async () => {
    setLoadingServicios(true);
    try {
      const params = new URLSearchParams();
      if (filtroDesde) params.append("desde", filtroDesde);
      if (filtroHasta) params.append("hasta", filtroHasta);
      const qs = params.toString() ? `?${params.toString()}` : "";
      const data = await api(`/citas/reporte-servicios/${qs}`);
      setReporteServicios(data);
    } catch {
      toast.error("Error al cargar reporte de servicios");
    } finally {
      setLoadingServicios(false);
    }
  };

  useEffect(() => { cargarVentas(); cargarServicios(); }, []);

  const totalVentas = reporteVentas?.por_hospital.reduce(
    (s, h) => s + parseFloat(h.total_ingresos || "0"), 0
  ) ?? 0;
  const totalVendidos = reporteVentas?.por_hospital.reduce(
    (s, h) => s + h.total_ventas, 0
  ) ?? 0;
  const totalServicios = reporteServicios?.totales.total_atenciones ?? 0;
  const totalIngresosServicios = parseFloat(
    reporteServicios?.totales.total_ingresos || "0"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Ventas y Servicios</h1>
        <p className="text-muted-foreground mt-1">Gestión de medicamentos vendidos y servicios prestados en la red.</p>
      </div>

      {/* Filtros */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1">
              <p className="text-xs text-muted-foreground">Desde</p>
              <Input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-xs text-muted-foreground">Hasta</p>
              <Input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} />
            </div>
            <Button onClick={() => { cargarVentas(); cargarServicios(); }}>
              Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-5">
            <DollarSign className="w-5 h-5 text-green-600 mb-3" />
            <p className="text-2xl font-bold text-foreground">S/ {totalVentas.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Ingresos por medicamentos</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <Pill className="w-5 h-5 text-primary mb-3" />
            <p className="text-2xl font-bold text-foreground">{totalVendidos}</p>
            <p className="text-xs text-muted-foreground mt-1">Ventas de medicamentos</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <Stethoscope className="w-5 h-5 text-accent mb-3" />
            <p className="text-2xl font-bold text-foreground">{totalServicios}</p>
            <p className="text-xs text-muted-foreground mt-1">Atenciones médicas</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <TrendingUp className="w-5 h-5 text-orange-500 mb-3" />
            <p className="text-2xl font-bold text-foreground">S/ {totalIngresosServicios.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Ingresos por servicios</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="medicamentos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="medicamentos">
            <Pill className="w-4 h-4 mr-2" />
            Medicamentos
          </TabsTrigger>
          <TabsTrigger value="servicios">
            <Stethoscope className="w-4 h-4 mr-2" />
            Servicios
          </TabsTrigger>
        </TabsList>

        {/* ── TAB MEDICAMENTOS ─────────────────────────────────────────── */}
        <TabsContent value="medicamentos" className="space-y-4">
          {/* Ingresos por hospital */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Ingresos por Hospital
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingVentas ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : !reporteVentas || reporteVentas.por_hospital.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground text-sm">
                  No hay ventas en el período seleccionado.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hospital</TableHead>
                      <TableHead>Ventas</TableHead>
                      <TableHead>Ingresos</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reporteVentas.por_hospital.map((h) => (
                      <TableRow key={h["despacho__cita__medico__usuario__medico__hospital__id"]}>
                        <TableCell className="font-medium text-sm">
                          {h["despacho__cita__medico__usuario__medico__hospital__nombre"]}
                        </TableCell>
                        <TableCell className="text-sm">{h.total_ventas}</TableCell>
                        <TableCell className="text-sm font-semibold text-primary">
                          S/ {parseFloat(h.total_ingresos || "0").toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {totalVentas ? Math.round((parseFloat(h.total_ingresos || "0") / totalVentas) * 100) : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Medicamentos más vendidos */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary" />
                Medicamentos Más Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingVentas ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : !reporteVentas || reporteVentas.mas_vendidos.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground text-sm">
                  Sin datos de ventas.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medicamento</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Unidades vendidas</TableHead>
                      <TableHead>Ingresos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reporteVentas.mas_vendidos.map((m, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-sm">{m.medicamento__nombre}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{m.medicamento__tipo}</Badge></TableCell>
                        <TableCell className="text-sm font-semibold text-primary">{m.total_vendido}</TableCell>
                        <TableCell className="text-sm">
                          S/ {parseFloat(m.total_ingresos || "0").toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB SERVICIOS ─────────────────────────────────────────────── */}
        <TabsContent value="servicios" className="space-y-4">
          {/* Ingresos por hospital */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Ingresos por Hospital
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingServicios ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : !reporteServicios || reporteServicios.por_hospital.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground text-sm">
                  No hay servicios en el período seleccionado.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hospital</TableHead>
                      <TableHead>Atenciones</TableHead>
                      <TableHead>Ingresos</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reporteServicios.por_hospital.map((h) => (
                      <TableRow key={h["medico__hospital__id"]}>
                        <TableCell className="font-medium text-sm">{h["medico__hospital__nombre"]}</TableCell>
                        <TableCell className="text-sm">{h.total_atenciones}</TableCell>
                        <TableCell className="text-sm font-semibold text-accent">
                          S/ {parseFloat(h.total_ingresos || "0").toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {totalIngresosServicios
                            ? Math.round((parseFloat(h.total_ingresos || "0") / totalIngresosServicios) * 100)
                            : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Desglose por tipo de servicio */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" />
                Ingresos por Tipo de Servicio
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingServicios ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : !reporteServicios || reporteServicios.por_servicio.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground text-sm">
                  Sin datos.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo de Servicio</TableHead>
                      <TableHead>Atenciones</TableHead>
                      <TableHead>Ingresos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reporteServicios.por_servicio.map((s, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-sm">{s.categoria_servicio}</TableCell>
                        <TableCell className="text-sm">{s.total_atenciones}</TableCell>
                        <TableCell className="text-sm font-semibold text-accent">
                          S/ {parseFloat(s.total_ingresos || "0").toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Desglose por médico */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Ingresos por Médico
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingServicios ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : !reporteServicios || reporteServicios.por_medico.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground text-sm">
                  Sin datos.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Médico</TableHead>
                      <TableHead>Especialidad</TableHead>
                      <TableHead>Hospital</TableHead>
                      <TableHead>Atenciones</TableHead>
                      <TableHead>Ingresos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reporteServicios.por_medico.map((m, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-sm">{m["medico__usuario__nombre"]}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{m["medico__especialidad"]}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{m["medico__hospital__nombre"]}</TableCell>
                        <TableCell className="text-sm">{m.total_atenciones}</TableCell>
                        <TableCell className="text-sm font-semibold text-accent">
                          S/ {parseFloat(m.total_ingresos || "0").toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminVentas;
