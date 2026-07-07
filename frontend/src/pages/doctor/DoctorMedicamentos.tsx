import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Search, Pill, ShoppingCart, User, Loader2, AlertCircle } from "lucide-react";
import { useState as useState2 } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Medicamento {
  id: number;
  nombre: string;
  costo: string | number;
  stock: number;
  tipo: string;
}

interface Despacho {
  id: number;
  cita: number;
  paciente_id: number;
  paciente_nombre: string;
  medico_nombre: string;
  fecha_despacho: string;
  total: string | number;
  items: Array<{
    medicamento_id: number;
    medicamento_nombre: string;
    cantidad: number;
    precio_unitario: string | number;
    subtotal: string | number;
  }>;
}

interface Cita {
  id: number;

  paciente: number;
  paciente_nombre: string;

  inicio: string;
}

const DoctorMedicamentos = () => {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [despachos, setDespachos] = useState<Despacho[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCita, setSelectedCita] = useState<string>("");
  const [despachoItems, setDespachoItems] = useState<Array<{ medicamento: number; cantidad: number }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchMedicamentos = async () => {
    setLoading(true);
    try {
      const data = await api("/medicamentos/catalogo/");
      setMedicamentos(Array.isArray(data?.results) ? data.results : []);
    } catch (err) {
      setMedicamentos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCitas = async () => {
    try {
      const data = await api("/citas/mis-citas-medico/?estado=confirmada");
      setCitas(Array.isArray(data) ? data : []);
    } catch (err) {
      setCitas([]);
    }
  };

  const fetchDespachos = async () => {
    try {
      const data = await api("/medicamentos/mis-despachos/");
      setDespachos(Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : []);
    } catch (err) {
      setDespachos([]);
    }
  };

  useEffect(() => {
    fetchMedicamentos();
    fetchCitas();
    fetchDespachos();
  }, []);

  const filtered = medicamentos.filter((m) =>
    m.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddItem = (medId: number) => {
    setDespachoItems((prev) => {
      const existing = prev.find((item) => item.medicamento === medId);
      if (existing) {
        return prev.map((item) =>
          item.medicamento === medId
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prev, { medicamento: medId, cantidad: 1 }];
    });
  };

  const handleRemoveItem = (medId: number) => {
    setDespachoItems((prev) => prev.filter((item) => item.medicamento !== medId));
  };

  const handleDespacho = async () => {
    setError(null);
    setSuccess(null);

    if (!selectedCita) {
      setError("Debes seleccionar una cita");
      return;
    }

    if (despachoItems.length === 0) {
      setError("Debes agregar al menos un medicamento");
      return;
    }

    setSubmitting(true);
    try {
      await api(`/medicamentos/despachar/${selectedCita}/`, {
        method: "POST",
        body: JSON.stringify({ items: despachoItems }),
      });
      setSuccess("Medicamentos despachados correctamente");
      setDespachoItems([]);
      setSelectedCita("");
      // Recargar catálogo y despachos
      fetchMedicamentos();
      fetchDespachos();
    } catch (err: any) {
      setError(err?.error || "Error al despachar medicamentos");
    } finally {
      setSubmitting(false);
    }
  };
  

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
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Despachar Medicamentos</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-100 text-green-700 p-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <div className="space-y-2">
                <Label>Seleccionar cita</Label>
                <Select value={selectedCita} onValueChange={setSelectedCita}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cita del paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {citas.map((cita) => (
                      <SelectItem key={cita.id} value={cita.id.toString()}>
                        {cita.paciente_nombre} - {new Date(cita.inicio).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCita && (
                <>
                  <div className="space-y-2">
                    <Label>Medicamentos a despachar</Label>
                    <div className="bg-secondary/30 border border-border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                      {medicamentos.map((med) => {
                        const item = despachoItems.find((i) => i.medicamento === med.id);
                        return (
                          <div key={med.id} className="flex items-center justify-between">
                            <span className="text-sm">{med.nombre}</span>
                            {item ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setDespachoItems((prev) =>
                                      prev.map((i) =>
                                        i.medicamento === med.id && i.cantidad > 1
                                          ? { ...i, cantidad: i.cantidad - 1 }
                                          : i
                                      )
                                    )
                                  }
                                >
                                  -
                                </Button>
                                <span className="w-8 text-center text-sm font-semibold">{item.cantidad}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setDespachoItems((prev) =>
                                      prev.map((i) =>
                                        i.medicamento === med.id
                                          ? { ...i, cantidad: i.cantidad + 1 }
                                          : i
                                      )
                                    )
                                  }
                                >
                                  +
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveItem(med.id)}
                                  className="text-destructive"
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddItem(med.id)}
                              >
                                Agregar
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-secondary/30 border border-border rounded-lg p-3 space-y-2">
                    <h4 className="font-semibold text-sm">Medicamentos seleccionados:</h4>
                    {despachoItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Ningún medicamento seleccionado</p>
                    ) : (
                      <ul className="space-y-1">
                        {despachoItems.map((item) => {
                          const med = medicamentos.find((m) => m.id === item.medicamento);
                          return (
                            <li key={item.medicamento} className="text-sm flex justify-between">
                              <span>{med?.nombre}</span>
                              <span className="font-semibold">x{item.cantidad}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button
                  onClick={handleDespacho}
                  disabled={submitting || !selectedCita || despachoItems.length === 0}
                  className="gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? "Despachando..." : "Confirmar Despacho"}
                </Button>
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
              placeholder="Buscar medicamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-muted-foreground">Cargando medicamentos...</span>
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicamento</TableHead>
                    <TableHead className="hidden md:table-cell">Tipo</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Precio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((med) => (
                    <TableRow key={med.id}>
                      <TableCell className="font-medium">{med.nombre}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary" className="text-xs">
                          {med.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            med.stock === 0
                              ? "text-destructive font-semibold"
                              : med.stock < 50
                              ? "text-yellow-600 font-semibold"
                              : "text-foreground"
                          }
                        >
                          {med.stock} unid.
                        </span>
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        S/ {Number(med.costo).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="despachos" className="mt-6 space-y-4">
          {despachos.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No hay despachos realizados aún.
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cita</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {despachos.map((despacho) => (
                    <TableRow key={despacho.id}>
                      <TableCell className="font-medium">#{despacho.cita}</TableCell>
                      <TableCell>{despacho.paciente_nombre}</TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        {despacho.items.length} medicamento(s)
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        S/ {Number(despacho.total).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell text-sm text-muted-foreground">
                        {new Date(despacho.fecha_despacho).toLocaleDateString('es-PE', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DoctorMedicamentos;
