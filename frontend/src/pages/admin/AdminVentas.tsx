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

interface VentaDia {
  fecha: string;
  total: string | number;
  cantidad: number;
}

interface ServicioEspecialidad {
  especialidad: string;
  total: number;
}

interface FacturaInfo {
  id: number;
  paciente_nombre: string;
  monto_total: string;
  pagada: boolean;
  fecha_emision: string;
  descripcion?: string;
}

const AdminVentas = () => {
  const [reporteVentas, setReporteVentas] = useState<VentaDia[]>([]);
  const [reporteServicios, setReporteServicios] = useState<ServicioEspecialidad[]>([]);
  const [facturas, setFacturas] = useState<FacturaInfo[]>([]);
  const [loadingVentas, setLoadingVentas] = useState(false);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [loadingFacturas, setLoadingFacturas] = useState(false);

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
      setReporteVentas(Array.isArray(data) ? data : []);
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
      setReporteServicios(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Error al cargar reporte de servicios");
    } finally {
      setLoadingServicios(false);
    }
  };

  const cargarFacturas = async () => {
    setLoadingFacturas(true);
    try {
      const data = await api("/facturacion/");
      setFacturas(Array.isArray(data) ? data : []);
    } catch {
      // sin toast - puede no haber facturas
    } finally {
      setLoadingFacturas(false);
    }
  };

  useEffect(() => { cargarVentas(); cargarServicios(); cargarFacturas(); }, []);

  const totalVentas = reporteVentas.reduce((s, h) => s + (Number(h.total) || 0), 0);
  const totalVendidos = reporteVentas.reduce((s, h) => s + (h.cantidad || 0), 0);
  const totalServicios = reporteServicios.reduce((s, h) => s + (h.total || 0), 0);
  const facturasPagadas = facturas.filter((f) => f.pagada);
  const ingresosFacturas = facturasPagadas.reduce((s, f) => s + (Number(f.monto_total) || 0), 0);

  const formatFecha = (iso: string) => {
    try { return new Date(iso).toLocaleDateString("es-PE"); } catch { return iso; }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Ventas y Servicios</h1>
        <p className="text-muted-foreground mt-1">Gestión de medicamentos vendidos y servicios prestados en la red.</p>
      </div>

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-5">
            <DollarSign className="w-5 h-5 text-green-600 mb-3" />
            <p className="text-2xl font-bold text-foreground">S/ {totalVentas.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Ingresos medicamentos</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <Pill className="w-5 h-5 text-primary mb-3" />
            <p className="text-2xl font-bold text-foreground">{totalVendidos}</p>
            <p className="text-xs text-muted-foreground mt-1">Medicamentos vendidos</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <Stethoscope className="w-5 h-5 text-accent mb-3" />
            <p className="text-2xl font-bold text-foreground">{totalServicios}</p>
            <p className="text-xs text-muted-foreground mt-1">Atenciones por especialidad</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <TrendingUp className="w-5 h-5 text-orange-500 mb-3" />
            <p className="text-2xl font-bold text-foreground">S/ {ingresosFacturas.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Facturación total</p>
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
          <TabsTrigger value="facturacion">
            <DollarSign className="w-4 h-4 mr-2" />
            Facturación
          </TabsTrigger>
        </TabsList>

        <TabsContent value="medicamentos" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary" />
                Ventas por Fecha
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingVentas ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : reporteVentas.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground text-sm">No hay ventas en el período seleccionado.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Ingresos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reporteVentas.map((v, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-sm">{formatFecha(v.fecha)}</TableCell>
                        <TableCell className="text-sm">{v.cantidad}</TableCell>
                        <TableCell className="text-sm font-semibold text-primary">
                          S/ {Number(v.total || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="servicios" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" />
                Atenciones por Especialidad
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingServicios ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : reporteServicios.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground text-sm">No hay servicios registrados.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Especialidad</TableHead>
                      <TableHead>Atenciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reporteServicios.map((s, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-sm">{s.especialidad}</TableCell>
                        <TableCell className="text-sm font-semibold text-accent">{s.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="facturacion" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Facturas Emitidas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingFacturas ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : facturas.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground text-sm">No hay facturas registradas.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturas.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium text-sm">{f.paciente_nombre || `#${f.id}`}</TableCell>
                        <TableCell className="text-sm font-semibold text-primary">
                          S/ {Number(f.monto_total).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={f.pagada ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                            {f.pagada ? "Pagada" : "Pendiente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatFecha(f.fecha_emision)}</TableCell>
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
