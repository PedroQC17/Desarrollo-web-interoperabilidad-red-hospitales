import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BarChart3, Download, FileText, TrendingUp,
  Users, Activity, Calendar, Loader2, Building2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, LineChart, Line,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { toast } from "sonner";

// ── Datos estáticos de respaldo (gráficos de tendencia) ──────────────────────
const monthlyVentas = [
  { mes: "May", ventas: 62000, citas: 980 },
  { mes: "Jun", ventas: 68500, citas: 1024 },
  { mes: "Jul", ventas: 71200, citas: 1102 },
  { mes: "Ago", ventas: 75800, citas: 1180 },
  { mes: "Sep", ventas: 79400, citas: 1208 },
  { mes: "Oct", ventas: 84520, citas: 1256 },
];

const especialidades = [
  { name: "Cardiología",      value: 32, color: "hsl(var(--primary))" },
  { name: "Pediatría",        value: 24, color: "hsl(var(--accent))" },
  { name: "Medicina General", value: 28, color: "hsl(168 60% 50%)" },
  { name: "Otros",            value: 16, color: "hsl(200 60% 70%)" },
];

const reportesGenerados = [
  { name: "Reporte Mensual de Ventas - Octubre",    date: "01 Nov 2025", type: "Ventas",     size: "2.4 MB" },
  { name: "Estadísticas de Atención Hospitalaria",  date: "28 Oct 2025", type: "Atención",   size: "1.8 MB" },
  { name: "Inventario de Medicamentos",             date: "25 Oct 2025", type: "Inventario", size: "3.1 MB" },
  { name: "Reporte de Usuarios Activos",            date: "20 Oct 2025", type: "Usuarios",   size: "1.2 MB" },
];

// ── Tipos ────────────────────────────────────────────────────────────────────
interface ReporteHospital {
  hospital__id:     number;
  hospital__nombre: string;
  total_citas:      number;
  total_medicos:    number;
}

// ── Componente ───────────────────────────────────────────────────────────────
const AdminReportes = () => {
  const [reporteHospitales, setReporteHospitales] = useState<ReporteHospital[]>([]);
  const [loadingReporte, setLoadingReporte]       = useState(false);
  const [errorReporte, setErrorReporte]           = useState<string | null>(null);
  const [filtroDesde, setFiltroDesde]             = useState("");
  const [filtroHasta, setFiltroHasta]             = useState("");
  const [filtroHospital, setFiltroHospital]       = useState("");

  // ── Carga reporte de hospitales ───────────────────────────────────────────
  const cargarReporte = async () => {
    setLoadingReporte(true);
    setErrorReporte(null);
    try {
      const params = new URLSearchParams();
      if (filtroDesde)   params.append("desde", filtroDesde);
      if (filtroHasta)   params.append("hasta", filtroHasta);
      const query = params.toString() ? `?${params.toString()}` : "";
      const data = await api(`/hospitales/reporte/${query}`);
      setReporteHospitales(Array.isArray(data) ? data : []);
    } catch {
      setErrorReporte("No se pudo cargar el reporte de hospitales.");
    } finally {
      setLoadingReporte(false);
    }
  };

  useEffect(() => { cargarReporte(); }, []);

  // ── Filtro local por nombre de hospital ───────────────────────────────────
  const hospitalesFiltrados = reporteHospitales.filter((h) =>
    h.hospital__nombre?.toLowerCase().includes(filtroHospital.toLowerCase())
  );

  const totalCitas = hospitalesFiltrados.reduce((s, h) => s + h.total_citas, 0);

  const handleDownload  = (name: string) => toast.success(`Descargando: ${name}`);
  const handleGenerate  = (type: string)  => toast.success(`Generando reporte de ${type}...`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Reportes y Estadísticas</h1>
        <p className="text-muted-foreground mt-1">Análisis y reportes operativos del sistema hospitalario.</p>
      </div>

      {/* Botones de generación rápida */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => handleGenerate("Ventas")}>
          <TrendingUp className="w-5 h-5 text-primary" />
          <span className="text-xs">Ventas</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => handleGenerate("Atención")}>
          <Activity className="w-5 h-5 text-accent" />
          <span className="text-xs">Atención</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => handleGenerate("Usuarios")}>
          <Users className="w-5 h-5 text-orange-500" />
          <span className="text-xs">Usuarios</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => handleGenerate("Citas")}>
          <Calendar className="w-5 h-5 text-green-600" />
          <span className="text-xs">Citas</span>
        </Button>
      </div>

      <Tabs defaultValue="hospitales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hospitales">Hospitales (en vivo)</TabsTrigger>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
          <TabsTrigger value="historial">Historial de Reportes</TabsTrigger>
        </TabsList>

        {/* ── Tab: Reporte de hospitales con datos reales ─────────────────── */}
        <TabsContent value="hospitales" className="space-y-4">

          {/* Filtros */}
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 space-y-1">
                  <p className="text-xs text-muted-foreground">Desde</p>
                  <Input
                    type="date"
                    value={filtroDesde}
                    onChange={(e) => setFiltroDesde(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-xs text-muted-foreground">Hasta</p>
                  <Input
                    type="date"
                    value={filtroHasta}
                    onChange={(e) => setFiltroHasta(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-xs text-muted-foreground">Buscar hospital</p>
                  <Input
                    placeholder="Nombre del hospital..."
                    value={filtroHospital}
                    onChange={(e) => setFiltroHospital(e.target.value)}
                  />
                </div>
                <Button onClick={cargarReporte} disabled={loadingReporte}>
                  {loadingReporte
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : "Filtrar"
                  }
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resumen */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-border">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{hospitalesFiltrados.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Hospitales en la red</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{totalCitas}</p>
                <p className="text-xs text-muted-foreground mt-1">Citas completadas</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {hospitalesFiltrados.reduce((s, h) => s + (h.total_medicos || 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Médicos activos</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de hospitales */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Citas por Hospital
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingReporte ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : errorReporte ? (
                <p className="text-center py-10 text-destructive text-sm">{errorReporte}</p>
              ) : hospitalesFiltrados.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground text-sm">
                  No hay datos para el rango seleccionado.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {hospitalesFiltrados.map((h) => (
                    <div key={h.hospital__id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{h.hospital__nombre}</p>
                          <p className="text-xs text-muted-foreground">{h.total_medicos || 0} médicos activos</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-primary/10 text-primary border-0">
                          {h.total_citas} citas
                        </Badge>
                        <div className="hidden sm:block w-24 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${totalCitas ? (h.total_citas / totalCitas) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {totalCitas ? Math.round((h.total_citas / totalCitas) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de barras con datos reales */}
          {hospitalesFiltrados.length > 0 && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Comparativa de Citas por Hospital
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={hospitalesFiltrados.map((h) => ({
                    nombre: h.hospital__nombre?.split(" ").slice(0, 2).join(" ") ?? "—",
                    citas:  h.total_citas,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="nombre" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="citas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Tab: Gráficos estáticos de tendencia ────────────────────────── */}
        <TabsContent value="graficos" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Ventas Mensuales (S/)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyVentas}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="ventas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  Citas Atendidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={monthlyVentas}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line type="monotone" dataKey="citas" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Distribución por Especialidad</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={especialidades}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${entry.value}%`}
                  >
                    {especialidades.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Historial de reportes ───────────────────────────────────── */}
        <TabsContent value="historial">
          <Card className="border-border">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {reportesGenerados.map((r) => (
                  <div key={r.name} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{r.date}</span>
                          <span>•</span>
                          <span>{r.size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs hidden md:inline-flex">{r.type}</Badge>
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(r.name)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReportes;