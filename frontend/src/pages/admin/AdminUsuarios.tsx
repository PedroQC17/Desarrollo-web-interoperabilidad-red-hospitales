import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, UserPlus, Trash2, Shield, Stethoscope, User as UserIcon, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { api } from "@/lib/api";

type UsuarioAPI = {
  id: number;
  nombre: string;
  email: string;
  tipo_usuario: "paciente" | "medico" | "admin";
  is_active: boolean;
};

type NuevoUsuario = {
  nombre: string;
  email: string;
  password: string;
  telecom: string;
  genero: string;
  fec_nac: string;
  tipo_usuario: "paciente" | "medico" | "admin";
};

const rolLabel: Record<string, string> = {
  paciente: "Paciente",
  medico: "Médico",
  admin: "Administrador",
};

const AdminUsuarios = () => {
  const [usuarios, setUsuarios] = useState<UsuarioAPI[]>([]);
  const [search, setSearch] = useState("");
  const [loadingIds, setLoadingIds] = useState<number[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState<NuevoUsuario>({
    nombre: "", email: "", password: "", telecom: "",
    genero: "", fec_nac: "", tipo_usuario: "paciente",
  });

  // ── Cargar usuarios del backend ──────────────────────────────────────────
  const cargarUsuarios = async () => {
    try {
      const data = await api("/usuarios/admin/usuarios/");
      setUsuarios(data);
    } catch {
      toast.error("Error al cargar usuarios");
    }
  };

  useEffect(() => { cargarUsuarios(); }, []);

  // ── Activar / Suspender ──────────────────────────────────────────────────
  const toggleEstado = async (u: UsuarioAPI) => {
    setLoadingIds((prev) => [...prev, u.id]);
    try {
      // Usamos el endpoint de cada rol según tipo_usuario
      const endpoint =
        u.tipo_usuario === "paciente" ? `/usuarios/pacientes/${u.id}/` :
        u.tipo_usuario === "medico"   ? `/usuarios/medicos/${u.id}/` :
                                        `/usuarios/administradores/${u.id}/`;

      // PATCH sobre el usuario base no existe directo, usamos el usuario
      await api(`/usuarios/admin/usuarios/`, { method: "GET" }); // solo para verificar token

      await api(`/usuarios/${u.id}/toggle-activo/`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !u.is_active }),
      });

      setUsuarios((prev) =>
        prev.map((x) => x.id === u.id ? { ...x, is_active: !u.is_active } : x)
      );
      toast.success(`Usuario ${u.is_active ? "suspendido" : "reactivado"} correctamente`);
    } catch {
      toast.error("Error al cambiar estado del usuario");
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== u.id));
    }
  };

  // ── Eliminar ─────────────────────────────────────────────────────────────
  const eliminarUsuario = async (u: UsuarioAPI) => {
    if (!confirm(`¿Eliminar a ${u.nombre}? Esta acción no se puede deshacer.`)) return;
    setLoadingIds((prev) => [...prev, u.id]);
    try {
      const endpoint =
        u.tipo_usuario === "paciente" ? `/usuarios/pacientes/${u.id}/` :
        u.tipo_usuario === "medico"   ? `/usuarios/medicos/${u.id}/` :
                                        `/usuarios/administradores/${u.id}/`;
      await api(endpoint, { method: "DELETE" });
      setUsuarios((prev) => prev.filter((x) => x.id !== u.id));
      toast.success(`${u.nombre} eliminado correctamente`);
    } catch {
      toast.error("Error al eliminar usuario");
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== u.id));
    }
  };

  // ── Crear usuario ─────────────────────────────────────────────────────────
  const crearUsuario = async () => {
    const { nombre, email, password, telecom, genero, fec_nac } = form;
    if (!nombre.trim() || !email.trim() || !password.trim() || !telecom.trim() || !genero || !fec_nac) {
      toast.error("Completa todos los campos obligatorios.");
      return;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre.trim())) {
      toast.error("El nombre solo debe contener letras y espacios.");
      return;
    }
    if (nombre.trim().split(/\s+/).length < 2) {
      toast.error("Ingresa el nombre completo (nombre y apellido).");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.com$/i.test(email.trim())) {
      toast.error("El correo debe tener '@' y terminar en '.com'.");
      return;
    }
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (!/^[0-9]{9}$/.test(telecom.trim())) {
      toast.error("El teléfono debe tener exactamente 9 dígitos numéricos.");
      return;
    }
    const añoNac = new Date(fec_nac).getFullYear();
    const edad   = new Date().getFullYear() - añoNac;
    if (añoNac < 1950) {
      toast.error("El año mínimo de nacimiento permitido es 1950.");
      return;
    }
    if (edad < 18) {
      toast.error("El usuario debe tener al menos 18 años.");
      return;
    }
    setFormLoading(true);
    try {
      await api("/usuarios/register/", {
        method: "POST",
        body: JSON.stringify(form),
      }, true);
      toast.success("Usuario creado correctamente");
      setShowForm(false);
      setForm({ nombre: "", email: "", password: "", telecom: "", genero: "", fec_nac: "", tipo_usuario: "paciente" });
      cargarUsuarios();
    } catch {
      toast.error("Error al crear usuario");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Filtros ───────────────────────────────────────────────────────────────
  const filtrar = (tipo?: string) =>
    usuarios.filter((u) => {
      const matchSearch =
        u.nombre.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchTipo = !tipo || u.tipo_usuario === tipo;
      return matchSearch && matchTipo;
    });

  // ── Tabla ─────────────────────────────────────────────────────────────────
  const renderTabla = (lista: UsuarioAPI[]) => (
    <Card className="border-border">
      <CardContent className="p-0">
        {lista.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No se encontraron usuarios.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {u.tipo_usuario === "medico" ? (
                          <Stethoscope className="w-4 h-4 text-primary" />
                        ) : u.tipo_usuario === "admin" ? (
                          <Shield className="w-4 h-4 text-primary" />
                        ) : (
                          <UserIcon className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <span className="font-medium text-sm">{u.nombre}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{rolLabel[u.tipo_usuario]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={u.is_active ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {u.is_active ? "Activo" : "Suspendido"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant={u.is_active ? "outline" : "default"}
                        disabled={loadingIds.includes(u.id)}
                        onClick={() => toggleEstado(u)}
                      >
                        {u.is_active ? "Suspender" : "Reactivar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={loadingIds.includes(u.id)}
                        onClick={() => eliminarUsuario(u)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">Administra pacientes, médicos y administradores del sistema.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Formulario nuevo usuario */}
      {showForm && (
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Crear Nuevo Usuario</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Nombre completo</label>
                <Input placeholder="Juan Pérez" value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Correo electrónico</label>
                <Input type="email" placeholder="correo@ejemplo.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Contraseña</label>
                <Input type="password" placeholder="••••••••" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Teléfono</label>
                <Input placeholder="+51 999 999 999" value={form.telecom}
                  onChange={(e) => setForm({ ...form, telecom: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Fecha de nacimiento</label>
                <Input type="date" value={form.fec_nac}
                  onChange={(e) => setForm({ ...form, fec_nac: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Género</label>
                <select
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                  value={form.genero}
                  onChange={(e) => setForm({ ...form, genero: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="O">Otro</option>
                </select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium">Tipo de usuario</label>
                <select
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                  value={form.tipo_usuario}
                  onChange={(e) => setForm({ ...form, tipo_usuario: e.target.value as any })}
                >
                  <option value="paciente">Paciente</option>
                  <option value="medico">Médico</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={crearUsuario} disabled={formLoading}>
                {formLoading ? "Creando..." : "Crear Usuario"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="todos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="todos">Todos ({usuarios.length})</TabsTrigger>
          <TabsTrigger value="pacientes">Pacientes ({filtrar("paciente").length})</TabsTrigger>
          <TabsTrigger value="medicos">Médicos ({filtrar("medico").length})</TabsTrigger>
          <TabsTrigger value="admins">Administradores ({filtrar("admin").length})</TabsTrigger>
        </TabsList>
        <TabsContent value="todos">{renderTabla(filtrar())}</TabsContent>
        <TabsContent value="pacientes">{renderTabla(filtrar("paciente"))}</TabsContent>
        <TabsContent value="medicos">{renderTabla(filtrar("medico"))}</TabsContent>
        <TabsContent value="admins">{renderTabla(filtrar("admin"))}</TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUsuarios;