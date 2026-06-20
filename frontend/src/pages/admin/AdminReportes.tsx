import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Download, FileText, TrendingUp, Users, Activity, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { toast } from "sonner";

const monthlyVentas = [
  { mes: "May", ventas: 62000, citas: 980 },
  { mes: "Jun", ventas: 68500, citas: 1024 },
  { mes: "Jul", ventas: 71200, citas: 1102 },
  { mes: "Ago", ventas: 75800, citas: 1180 },
  { mes: "Sep", ventas: 79400, citas: 1208 },
  { mes: "Oct", ventas: 84520, citas: 1256 },
];

const especialidades = [
  { name: "Cardiología", value: 32, color: "hsl(var(--primary))" },
  { name: "Pediatría", value: 24, color: "hsl(var(--accent))" },
  { name: "Medicina General", value: 28, color: "hsl(168 60% 50%)" },
  { name: "Otros", value: 16, color: "hsl(200 60% 70%)" },
];

const reportesGenerados = [
  { name: "Reporte Mensual de Ventas - Octubre", date: "01 Nov 2025", type: "Ventas", size: "2.4 MB" },
  { name: "Estadísticas de Atención Hospitalaria", date: "28 Oct 2025", type: "Atención", size: "1.8 MB" },
  { name: "Inventario de Medicamentos", date: "25 Oct 2025", type: "Inventario", size: "3.1 MB" },
  { name: "Reporte de Usuarios Activos", date: "20 Oct 2025", type: "Usuarios", size: "1.2 MB" },
];

const AdminReportes = () => {
  const handleDownload = (name: string) => {
    toast.success(`Descargando: ${name}`);
  };

  const handleGenerate = (type: string) => {
    toast.success(`Generando reporte de ${type}...`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Reportes y Estadísticas</h1>
        <p className="text-muted-foreground mt-1">Análisis y reportes operativos del sistema hospitalario.</p>
      </div>

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

      <Tabs defaultValue="graficos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
          <TabsTrigger value="historial">Historial de Reportes</TabsTrigger>
        </TabsList>

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
