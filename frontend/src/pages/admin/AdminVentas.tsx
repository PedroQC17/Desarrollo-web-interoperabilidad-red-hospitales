import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pill, Stethoscope, TrendingUp, DollarSign, ShoppingCart, Edit } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ventasStats = [
  { label: "Ventas del Mes", value: "S/ 84,520", icon: DollarSign, color: "text-green-600" },
  { label: "Medicamentos Vendidos", value: "1,248", icon: Pill, color: "text-primary" },
  { label: "Servicios Prestados", value: "562", icon: Stethoscope, color: "text-accent" },
  { label: "Crecimiento", value: "+12%", icon: TrendingUp, color: "text-orange-500" },
];

const medicamentos = [
  { name: "Paracetamol 500mg", category: "Analgésico", price: 8.5, sold: 245, stock: 1200 },
  { name: "Amoxicilina 500mg", category: "Antibiótico", price: 24.0, sold: 187, stock: 540 },
  { name: "Ibuprofeno 400mg", category: "Antiinflamatorio", price: 12.0, sold: 156, stock: 890 },
  { name: "Loratadina 10mg", category: "Antihistamínico", price: 15.5, sold: 98, stock: 420 },
  { name: "Omeprazol 20mg", category: "Gastrointestinal", price: 18.0, sold: 134, stock: 680 },
];

const servicios = [
  { name: "Consulta Médica General", price: 80, count: 245 },
  { name: "Consulta Especializada", price: 150, count: 142 },
  { name: "Examen de Laboratorio", price: 60, count: 98 },
  { name: "Radiografía", price: 120, count: 56 },
  { name: "Ecografía", price: 180, count: 21 },
];

const AdminVentas = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Ventas y Servicios</h1>
        <p className="text-muted-foreground mt-1">Gestión de medicamentos vendidos y servicios prestados en la red.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ventasStats.map((s) => (
          <Card key={s.label} className="border-border">
            <CardContent className="p-5">
              <s.icon className={`w-5 h-5 ${s.color} mb-3`} />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
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

        <TabsContent value="medicamentos">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Catálogo de Medicamentos</CardTitle>
              <Button size="sm">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Nuevo
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicamento</TableHead>
                    <TableHead className="hidden md:table-cell">Categoría</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Vendidos</TableHead>
                    <TableHead className="hidden md:table-cell">Stock</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicamentos.map((m) => (
                    <TableRow key={m.name}>
                      <TableCell className="font-medium text-sm">{m.name}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">{m.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">S/ {m.price.toFixed(2)}</TableCell>
                      <TableCell className="text-sm font-semibold text-primary">{m.sold}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{m.stock}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="servicios">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Servicios Médicos</CardTitle>
              <Button size="sm">
                <Stethoscope className="w-4 h-4 mr-2" />
                Nuevo
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Tarifa</TableHead>
                    <TableHead>Prestaciones</TableHead>
                    <TableHead>Total Generado</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servicios.map((s) => (
                    <TableRow key={s.name}>
                      <TableCell className="font-medium text-sm">{s.name}</TableCell>
                      <TableCell className="text-sm">S/ {s.price.toFixed(2)}</TableCell>
                      <TableCell className="text-sm font-semibold text-primary">{s.count}</TableCell>
                      <TableCell className="text-sm">S/ {(s.price * s.count).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminVentas;
