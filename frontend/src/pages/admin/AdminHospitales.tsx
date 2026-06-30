import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Search, MapPin, Phone, Edit, Clock, Stethoscope, LogOut } from "lucide-react";

import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { api } from "@/lib/api";

type Hospital = {
  id: number;
  tipo: "publico" | "privado" | "clinica" | "centro_salud";
  nombre: string;
  alias: string;
  descripcion: string;
  contacto: string;
  especialidad: string;
  ubicacion: string;
  periodo: string;
  activo: boolean;
  creado_en: string;
  fecha_desactivacion: string | null;
  motivo_desactivacion: string;
};

type FormHospital = {
  tipo: string;
  nombre: string;
  alias: string;
  descripcion: string;
  contacto: string;
  especialidad: string;
  ubicacion: string;
  periodo: string;
};

const emptyForm: FormHospital = {
  tipo: "publico", nombre: "", alias: "", descripcion: "",
  contacto: "", especialidad: "", ubicacion: "", periodo: "",
};

const tipoLabel: Record<string, string> = {
  publico:      "Público",
  privado:      "Privado",
  clinica:      "Clínica",
  centro_salud: "Centro de Salud",
};

const AdminHospitales = () => {
  const [hospitales, setHospitales]         = useState<Hospital[]>([]);
  const [search, setSearch]                 = useState("");
  const [openCrear, setOpenCrear]           = useState(false);
  const [openEditar, setOpenEditar]         = useState(false);
  const [hospitalEditar, setHospitalEditar] = useState<Hospital | null>(null);
  const [form, setForm]                     = useState<FormHospital>(emptyForm);
  const [formLoading, setFormLoading]       = useState(false);
  const [loadingIds, setLoadingIds]         = useState<number[]>([]);
  const [errores, setErrores]               = useState<Record<string, string>>({});

  // Diálogo de desafiliación
  const [hospitalDesafiliar, setHospitalDesafiliar] = useState<Hospital | null>(null);
  const [motivoDesafiliar, setMotivoDesafiliar]     = useState("");
  const [desafiliando, setDesafiliando]             = useState(false);

  // ── Cargar ────────────────────────────────────────────────────────────────
  const cargarHospitales = async () => {
    try {
      const data = await api("/hospitales/hospitales/?activo=true");
      setHospitales(data);
    } catch {
      toast.error("Error al cargar hospitales");
    }
  };

  useEffect(() => { cargarHospitales(); }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errores[e.target.name]) {
      setErrores((prev) => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const limpiarErrores = () => setErrores({});

  function validarForm(): boolean {
    const err: Record<string, string> = {};
    const { nombre, contacto, especialidad, ubicacion, periodo, descripcion } = form;

    if (!nombre?.trim()) err.nombre = "El nombre es obligatorio.";
    else if (!/^[\p{L}\s0-9]+$/u.test(nombre.trim())) err.nombre = "Solo letras, espacios y números.";
    else if (nombre.trim().startsWith(" ")) err.nombre = "No puede empezar con espacio.";

    if (!contacto?.trim()) err.contacto = "El contacto es obligatorio.";
    else if (!/^[0-9]{7,9}$/.test(contacto.trim())) err.contacto = "Debe tener 7-9 dígitos.";

    if (!ubicacion?.trim()) err.ubicacion = "La ubicación es obligatoria.";
    else if (ubicacion.trim().length < 5) err.ubicacion = "Mínimo 5 caracteres.";

    if (!especialidad?.trim()) err.especialidad = "La especialidad es obligatoria.";
    if (!periodo?.trim()) err.periodo = "El horario es obligatorio.";
    if (descripcion?.trim() && descripcion.trim().length < 10) err.descripcion = "Mínimo 10 caracteres.";

    setErrores(err);
    return Object.keys(err).length === 0;
  }

  // Bloquea caracteres especiales en el nombre del hospital
  const handleNombreKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const permitidas = ["Backspace","Delete","ArrowLeft","ArrowRight","Tab"];
    if (!permitidas.includes(e.key) && !/^[\p{L}\s0-9]$/u.test(e.key)) {
      e.preventDefault();
      return;
    }
    if (e.key === " " && e.currentTarget.selectionStart === 0) {
      e.preventDefault();
    }
  };

  // Bloquea teclas no numéricas en el contacto
  const handleContactoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const permitidas = ["Backspace","Delete","ArrowLeft","ArrowRight","Tab"];
    if (!permitidas.includes(e.key) && !/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  // ── Crear ─────────────────────────────────────────────────────────────────
  const crearHospital = async () => {
    if (!validarForm()) return;
    setFormLoading(true);
    try {
      await api("/hospitales/hospitales/", {
        method: "POST",
        body: JSON.stringify({ ...form, activo: true }),
      });
      toast.success("Hospital registrado correctamente");
      setOpenCrear(false);
      setForm(emptyForm);
      cargarHospitales();
    } catch (err: any) {
      const msg = err?.nombre?.[0] || err?.error || "Error al registrar hospital";
      toast.error(msg);
    } finally {
      setFormLoading(false);
    }
  };

  // ── Editar ────────────────────────────────────────────────────────────────
  const abrirEditar = (h: Hospital) => {
    setHospitalEditar(h);
    limpiarErrores();
    setForm({
      tipo:        h.tipo,
      nombre:      h.nombre,
      alias:       h.alias,
      descripcion: h.descripcion,
      contacto:    h.contacto,
      especialidad: h.especialidad,
      ubicacion:   h.ubicacion,
      periodo:     h.periodo,
    });
    setOpenEditar(true);
  };

  const guardarEdicion = async () => {
    if (!hospitalEditar) return;
    if (!validarForm()) return;
    setFormLoading(true);
    try {
      await api(`/hospitales/hospitales/${hospitalEditar.id}/`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      toast.success("Hospital actualizado correctamente");
      setOpenEditar(false);
      setHospitalEditar(null);
      setForm(emptyForm);
      cargarHospitales();
    } catch (err: any) {
      const msg = err?.nombre?.[0] || err?.error || "Error al actualizar hospital";
      toast.error(msg);
    } finally {
      setFormLoading(false);
    }
  };

  // ── Desafiliar (desactivación suave) ──────────────────────────────────────
  const abrirDesafiliar = (h: Hospital) => {
    setHospitalDesafiliar(h);
    setMotivoDesafiliar("");
  };

  const confirmarDesafiliar = async () => {
    if (!hospitalDesafiliar) return;
    if (!motivoDesafiliar.trim()) {
      toast.error("Debes ingresar el motivo de la desafiliación.");
      return;
    }
    setDesafiliando(true);
    setLoadingIds((prev) => [...prev, hospitalDesafiliar.id]);
    try {
      await api(`/hospitales/hospitales/${hospitalDesafiliar.id}/desafiliar/`, {
        method: "POST",
        body: JSON.stringify({ motivo: motivoDesafiliar.trim() }),
      });
      toast.success(`Hospital "${hospitalDesafiliar.nombre}" desafiliado correctamente`);
      setHospitalDesafiliar(null);
      setMotivoDesafiliar("");
      cargarHospitales();
    } catch {
      toast.error("Error al desafiliar hospital");
    } finally {
      setDesafiliando(false);
      setLoadingIds((prev) => prev.filter((id) => id !== hospitalDesafiliar.id));
    }
  };

  // ── Filtro ────────────────────────────────────────────────────────────────
  const filtrados = hospitales.filter((h) =>
    h.nombre.toLowerCase().includes(search.toLowerCase()) ||
    h.ubicacion.toLowerCase().includes(search.toLowerCase()) ||
    h.especialidad.toLowerCase().includes(search.toLowerCase())
  );

  // ── Formulario reutilizable ───────────────────────────────────────────────
  const renderForm = (onConfirm: () => void, labelBtn: string) => (
    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-1">

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Tipo <span className="text-destructive">*</span></Label>
          <select name="tipo" value={form.tipo} onChange={handleChange}
            className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background">
            <option value="publico">Público</option>
            <option value="privado">Privado</option>
            <option value="clinica">Clínica</option>
            <option value="centro_salud">Centro de Salud</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label>Nombre <span className="text-destructive">*</span></Label>
          <Input name="nombre" placeholder="Hospital Nacional..." value={form.nombre} onChange={handleChange} onKeyDown={handleNombreKeyDown} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Alias</Label>
          <Input name="alias" placeholder="HNL" value={form.alias} onChange={handleChange} />
        </div>
        <div className="space-y-1">
          <Label>Contacto <span className="text-destructive">*</span></Label>
          <Input name="contacto" placeholder="999999999" value={form.contacto} onChange={handleChange} onKeyDown={handleContactoKeyDown} maxLength={9} inputMode="numeric" />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Especialidad <span className="text-destructive">*</span></Label>
        <Input name="especialidad" placeholder="Cardiología, Traumatología..." value={form.especialidad} onChange={handleChange} />
      </div>

      <div className="space-y-1">
        <Label>Ubicación <span className="text-destructive">*</span></Label>
        <Input name="ubicacion" placeholder="Av. Alfonso Ugarte 848, Lima" value={form.ubicacion} onChange={handleChange} />
      </div>

      <div className="space-y-1">
        <Label>Horario de atención <span className="text-destructive">*</span></Label>
        <Input name="periodo" placeholder="Lun-Vie 8am-6pm" value={form.periodo} onChange={handleChange} />
      </div>

      <div className="space-y-1">
        <Label>Descripción</Label>
        <textarea
          name="descripcion"
          placeholder="Descripción del hospital..."
          value={form.descripcion}
          onChange={handleChange}
          rows={3}
          maxLength={100}
          className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background resize-none"
        />
      </div>

      <DialogFooter>
        <Button onClick={onConfirm} disabled={formLoading}>
          {formLoading ? "Guardando..." : labelBtn}
        </Button>
      </DialogFooter>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gestión de Hospitales</h1>
          <p className="text-muted-foreground mt-1">Administra la red de hospitales integrados al sistema.</p>
        </div>

        {/* Dialog Crear */}
        <Dialog open={openCrear} onOpenChange={(v) => { setOpenCrear(v); if (!v) setForm(emptyForm); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Hospital
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Hospital</DialogTitle>
              <DialogDescription>Agrega un nuevo hospital a la red SIEHC.</DialogDescription>
            </DialogHeader>
            {renderForm(crearHospital, "Registrar")}
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialog Editar */}
      <Dialog open={openEditar} onOpenChange={(v) => {
        setOpenEditar(v);
        if (!v) { setHospitalEditar(null); setForm(emptyForm); }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Hospital</DialogTitle>
            <DialogDescription>Modifica los datos de {hospitalEditar?.nombre}.</DialogDescription>
          </DialogHeader>
          {renderForm(guardarEdicion, "Guardar Cambios")}
        </DialogContent>
      </Dialog>

      {/* Dialog Desafiliar */}
      <Dialog open={!!hospitalDesafiliar} onOpenChange={(v) => { if (!v) setHospitalDesafiliar(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Desafiliar Hospital</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de desafiliar <strong>{hospitalDesafiliar?.nombre}</strong>?
              El hospital dejará de estar disponible en la red.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Motivo de la desafiliación <span className="text-destructive">*</span></Label>
            <Textarea
              placeholder="Indica el motivo por el cual se desafilia este hospital..."
              value={motivoDesafiliar}
              onChange={(e) => setMotivoDesafiliar(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHospitalDesafiliar(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarDesafiliar}
              disabled={desafiliando || !motivoDesafiliar.trim()}
            >
              {desafiliando ? "Desafiliando..." : "Confirmar Desafiliación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, ubicación o especialidad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Cards */}
      {filtrados.length === 0 ? (
        <div className="text-center text-muted-foreground py-12 text-sm">
          No se encontraron hospitales activos.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtrados.map((h) => (
            <Card key={h.id} className="border-border">
              <CardContent className="p-5">

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{h.nombre}</h3>
                      {h.alias && (
                        <span className="text-xs text-muted-foreground">{h.alias}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={h.activo ? "default" : "secondary"} className="text-xs">
                      {h.activo ? "Activo" : "Inactivo"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {tipoLabel[h.tipo]}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{h.ubicacion}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Stethoscope className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{h.especialidad}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{h.contacto}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{h.periodo}</span>
                  </div>
                </div>

                {h.descripcion && (
                  <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-2 mb-4 line-clamp-2">
                    {h.descripcion}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => abrirEditar(h)}>
                    <Edit className="w-3.5 h-3.5 mr-1.5" />
                    Editar
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={loadingIds.includes(h.id)}
                    onClick={() => abrirDesafiliar(h)}
                  >
                    <LogOut className="w-3.5 h-3.5 mr-1" />
                    Desafiliar
                  </Button>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminHospitales;
