import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, UserPlus, MoreVertical, Shield, Stethoscope, User as UserIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

type User = {
  id: number;
  name: string;
  email: string;
  role: "Paciente" | "Médico" | "Administrador";
  hospital?: string;
  status: "Activo" | "Suspendido" | "Pendiente";
};

const initialUsers: User[] = [
  { id: 1, name: "Juan Pérez", email: "juan.perez@gmail.com", role: "Paciente", status: "Activo" },
  { id: 2, name: "María Torres", email: "maria.torres@gmail.com", role: "Paciente", status: "Activo" },
  { id: 3, name: "Dr. Carlos García", email: "cgarcia@siehc.pe", role: "Médico", hospital: "Hospital Loayza", status: "Activo" },
  { id: 4, name: "Dra. Lucía Fernández", email: "lfernandez@siehc.pe", role: "Médico", hospital: "Hospital Almenara", status: "Activo" },
  { id: 5, name: "Ana Mendoza", email: "amendoza@siehc.pe", role: "Administrador", status: "Activo" },
  { id: 6, name: "Pedro Vargas", email: "pvargas@gmail.com", role: "Paciente", status: "Pendiente" },
  { id: 7, name: "Dr. Roberto Silva", email: "rsilva@siehc.pe", role: "Médico", hospital: "Hospital Rebagliati", status: "Pendiente" },
  { id: 8, name: "Luis Quispe", email: "lquispe@gmail.com", role: "Paciente", status: "Suspendido" },
];

const AdminUsuarios = () => {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");

  const handleStatusChange = (id: number, newStatus: User["status"]) => {
    setUsers(users.map((u) => (u.id === id ? { ...u, status: newStatus } : u)));
    toast.success(`Estado actualizado a ${newStatus}`);
  };

  const filterByRole = (role?: string) => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = !role || u.role === role;
      return matchesSearch && matchesRole;
    });
  };

  const renderTable = (list: User[]) => (
    <Card className="border-border">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="hidden lg:table-cell">Hospital</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {u.role === "Médico" ? (
                        <Stethoscope className="w-4 h-4 text-primary" />
                      ) : u.role === "Administrador" ? (
                        <Shield className="w-4 h-4 text-primary" />
                      ) : (
                        <UserIcon className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <span className="font-medium text-sm">{u.name}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{u.role}</Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{u.hospital || "—"}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      u.status === "Activo" ? "default" : u.status === "Pendiente" ? "secondary" : "destructive"
                    }
                    className="text-xs"
                  >
                    {u.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {u.status === "Pendiente" ? (
                    <Button size="sm" onClick={() => handleStatusChange(u.id, "Activo")}>
                      Aprobar
                    </Button>
                  ) : u.status === "Activo" ? (
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(u.id, "Suspendido")}>
                      Suspender
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(u.id, "Activo")}>
                      Reactivar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">Administra pacientes, médicos y administradores del sistema.</p>
        </div>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="todos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="todos">Todos ({users.length})</TabsTrigger>
          <TabsTrigger value="pacientes">Pacientes</TabsTrigger>
          <TabsTrigger value="medicos">Médicos</TabsTrigger>
          <TabsTrigger value="admins">Administradores</TabsTrigger>
        </TabsList>
        <TabsContent value="todos">{renderTable(filterByRole())}</TabsContent>
        <TabsContent value="pacientes">{renderTable(filterByRole("Paciente"))}</TabsContent>
        <TabsContent value="medicos">{renderTable(filterByRole("Médico"))}</TabsContent>
        <TabsContent value="admins">{renderTable(filterByRole("Administrador"))}</TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUsuarios;
