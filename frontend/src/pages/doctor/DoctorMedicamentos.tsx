import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Search, Pill, ShoppingCart, User } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const medications = [
  { id: 1, name: "Losartán 50mg", generic: "Losartán Potásico", category: "Antihipertensivo", stock: 240, unit: "tabletas", price: 0.80 },
  { id: 2, name: "Amlodipino 5mg", generic: "Amlodipino Besilato", category: "Antihipertensivo", stock: 180, unit: "tabletas", price: 0.50 },
  { id: 3, name: "Atorvastatina 20mg", generic: "Atorvastatina Cálcica", category: "Hipolipemiante", stock: 120, unit: "tabletas", price: 1.20 },
  { id: 4, name: "Metformina 850mg", generic: "Metformina HCl", category: "Antidiabético", stock: 300, unit: "tabletas", price: 0.40 },
  { id: 5, name: "Furosemida 40mg", generic: "Furosemida", category: "Diurético", stock: 150, unit: "tabletas", price: 0.35 },
  { id: 6, name: "Enalapril 10mg", generic: "Enalapril Maleato", category: "IECA", stock: 200, unit: "tabletas", price: 0.45 },
  { id: 7, name: "Propranolol 40mg", generic: "Propranolol HCl", category: "Betabloqueante", stock: 90, unit: "tabletas", price: 0.60 },
  { id: 8, name: "Salbutamol Inhalador", generic: "Salbutamol", category: "Broncodilatador", stock: 45, unit: "unidades", price: 12.00 },
  { id: 9, name: "Rivaroxabán 20mg", generic: "Rivaroxabán", category: "Anticoagulante", stock: 30, unit: "tabletas", price: 8.50 },
  { id: 10, name: "Espironolactona 25mg", generic: "Espironolactona", category: "Diurético", stock: 0, unit: "tabletas", price: 0.55 },
];

const dispatchHistory = [
  { id: 1, date: "15 Abr 2026", patient: "Juan Pérez", medications: "Losartán 50mg x30, Amlodipino 5mg x30", total: "S/ 39.00" },
  { id: 2, date: "14 Abr 2026", patient: "María Torres", medications: "Propranolol 40mg x60", total: "S/ 36.00" },
  { id: 3, date: "14 Abr 2026", patient: "Luis Ramos", medications: "Furosemida 40mg x30, Enalapril 10mg x60, Espironolactona 25mg x30", total: "S/ 54.00" },
  { id: 4, date: "10 Abr 2026", patient: "Pedro Vargas", medications: "Rivaroxabán 20mg x30", total: "S/ 255.00" },
];

const DoctorMedicamentos = () => {
  const [search, setSearch] = useState("");
  const filtered = medications.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.generic.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Medicamentos</h1>
          <p className="text-muted-foreground mt-1">Consulta el catálogo y despacha medicamentos a pacientes.</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <ShoppingCart className="w-4 h-4" />
              Despachar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Despachar Medicamentos</DialogTitle>
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
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Receta asociada</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Seleccionar receta" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="r1">Receta #001 — Juan Pérez (15 Abr)</SelectItem>
                    <SelectItem value="r2">Receta #002 — María Torres (14 Abr)</SelectItem>
                    <SelectItem value="r3">Receta #003 — Luis Ramos (14 Abr)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Medicamentos a despachar</Label>
                <div className="text-sm text-muted-foreground bg-secondary/50 rounded-lg p-3">
                  Seleccione una receta para cargar automáticamente los medicamentos.
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button>Confirmar Despacho</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="catalogo" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="catalogo" className="gap-2">
            <Package className="w-4 h-4" />
            Catálogo
          </TabsTrigger>
          <TabsTrigger value="despachos" className="gap-2">
            <ShoppingCart className="w-4 h-4" />
            Despachos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalogo" className="mt-6 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre genérico o comercial..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicamento</TableHead>
                  <TableHead className="hidden sm:table-cell">Nombre Genérico</TableHead>
                  <TableHead className="hidden md:table-cell">Categoría</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Precio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((med) => (
                  <TableRow key={med.id}>
                    <TableCell className="font-medium">{med.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{med.generic}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary" className="text-xs">{med.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={med.stock === 0 ? "text-destructive font-semibold" : med.stock < 50 ? "text-yellow-600 font-semibold" : "text-foreground"}>
                        {med.stock} {med.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">S/ {med.price.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="despachos" className="mt-6 space-y-4">
          {dispatchHistory.map((d) => (
            <Card key={d.id} className="border-border">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-foreground">{d.patient}</h3>
                      <p className="text-xs text-muted-foreground">{d.date}</p>
                      <p className="text-sm text-foreground/80">{d.medications}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-foreground">{d.total}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DoctorMedicamentos;
