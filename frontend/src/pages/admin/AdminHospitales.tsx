import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Search, MapPin, Phone, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const initialHospitals = [
  { id: 1, name: "Hospital Nacional Loayza", city: "Lima", phone: "+51 1 614-4646", beds: 460, status: "Activo", doctors: 142 },
  { id: 2, name: "Hospital Almenara", city: "Lima", phone: "+51 1 324-2983", beds: 690, status: "Activo", doctors: 198 },
  { id: 3, name: "Hospital Rebagliati", city: "Lima", phone: "+51 1 265-4901", beds: 1100, status: "Activo", doctors: 312 },
  { id: 4, name: "Hospital Cayetano Heredia", city: "Lima", phone: "+51 1 482-0402", beds: 384, status: "Activo", doctors: 96 },
  { id: 5, name: "Hospital Regional Arequipa", city: "Arequipa", phone: "+51 54 231-313", beds: 280, status: "Mantenimiento", doctors: 64 },
  { id: 6, name: "Hospital Belén Trujillo", city: "Trujillo", phone: "+51 44 245-748", beds: 320, status: "Activo", doctors: 78 },
];

const AdminHospitales = () => {
  const [hospitals, setHospitals] = useState(initialHospitals);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = hospitals.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.city.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: number) => {
    setHospitals(hospitals.filter((h) => h.id !== id));
    toast.success("Hospital eliminado de la red");
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newH = {
      id: hospitals.length + 1,
      name: formData.get("name") as string,
      city: formData.get("city") as string,
      phone: formData.get("phone") as string,
      beds: Number(formData.get("beds")),
      doctors: 0,
      status: "Activo",
    };
    setHospitals([...hospitals, newH]);
    setOpen(false);
    toast.success("Hospital registrado correctamente");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gestión de Hospitales</h1>
          <p className="text-muted-foreground mt-1">Administra la red de hospitales integrados al sistema.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Hospital
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAdd}>
              <DialogHeader>
                <DialogTitle>Registrar Hospital</DialogTitle>
                <DialogDescription>Agrega un nuevo hospital a la red SIEHC.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Nombre del Hospital</Label>
                  <Input id="name" name="name" required placeholder="Hospital..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city">Ciudad</Label>
                    <Input id="city" name="city" required placeholder="Lima" />
                  </div>
                  <div>
                    <Label htmlFor="beds">Camas</Label>
                    <Input id="beds" name="beds" type="number" required placeholder="200" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" name="phone" required placeholder="+51..." />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Registrar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar hospital o ciudad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((h) => (
          <Card key={h.id} className="border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{h.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      {h.city}
                    </div>
                  </div>
                </div>
                <Badge variant={h.status === "Activo" ? "default" : "secondary"} className="text-xs">
                  {h.status}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                <div className="bg-secondary/50 rounded-lg py-2">
                  <p className="text-lg font-bold text-foreground">{h.beds}</p>
                  <p className="text-xs text-muted-foreground">Camas</p>
                </div>
                <div className="bg-secondary/50 rounded-lg py-2">
                  <p className="text-lg font-bold text-foreground">{h.doctors}</p>
                  <p className="text-xs text-muted-foreground">Médicos</p>
                </div>
                <div className="bg-secondary/50 rounded-lg py-2 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="w-3.5 h-3.5 mr-1.5" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(h.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminHospitales;
