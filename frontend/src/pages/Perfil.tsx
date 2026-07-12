import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/lib/authContext";
import { updateProfile, uploadProfilePhoto, deleteProfilePhoto, getNotifPrefs, updateNotifPrefs } from "@/lib/auth";
import { User, Camera, Trash2, Bell, Loader2, Save, Mail, Phone, Calendar, Shield } from "lucide-react";

const Perfil = () => {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);

  const [form, setForm] = useState({
    nombre: user?.nombre || "",
    telecom: user?.telecom || "",
    genero: user?.genero || "",
    fec_nac: user?.fec_nac || "",
  });

  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    alerta_stock_bajo: true,
    reportes_automaticos: true,
    aprobacion_usuarios: true,
    alertas_email: false,
    recordatorio_citas: true,
    resultados_historial: true,
  });

  useEffect(() => {
    if (user) {
      setForm({
        nombre: user.nombre || "",
        telecom: user.telecom || "",
        genero: user.genero || "",
        fec_nac: user.fec_nac || "",
      });
    }
  }, [user]);

  useEffect(() => {
    getNotifPrefs()
      .then((data) => setNotifPrefs(data))
      .catch(() => {});
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const data = await updateProfile(form);
      setUser({ ...user!, nombre: data.nombre, telecom: data.telecom, genero: data.genero, fec_nac: data.fec_nac });
      toast.success("Perfil actualizado correctamente");
    } catch {
      toast.error("Error al actualizar el perfil");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await uploadProfilePhoto(file);
      setUser({ ...user!, foto: data.foto });
      toast.success("Foto actualizada correctamente");
    } catch {
      toast.error("Error al subir la foto");
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoDelete = async () => {
    try {
      await deleteProfilePhoto();
      setUser({ ...user!, foto: null });
      toast.success("Foto eliminada");
    } catch {
      toast.error("Error al eliminar la foto");
    }
  };

  const handleNotifToggle = async (key: string, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    setNotifSaving(true);
    try {
      await updateNotifPrefs({ [key]: value });
    } catch {
      setNotifPrefs(notifPrefs);
      toast.error("Error al actualizar preferencia");
    } finally {
      setNotifSaving(false);
    }
  };

  const initial = user?.nombre?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Mi Perfil</h1>
        <p className="text-muted-foreground mt-1">Administra tu información personal y preferencias.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Foto de Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="w-32 h-32">
              <AvatarImage src={user?.foto || undefined} />
              <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                {initial}
              </AvatarFallback>
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {uploading ? "Subiendo..." : "Subir Foto"}
              </Button>
              {user?.foto && (
                <Button variant="outline" size="sm" onClick={handlePhotoDelete}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Formatos: JPG, PNG. Tamaño máx: 5MB
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Información Personal
            </CardTitle>
            <CardDescription>Actualiza tus datos básicos de perfil.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{user?.email}</span>
              <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
                {user?.tipo_usuario}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input id="nombre" value={form.nombre} onChange={(e) => handleChange("nombre", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telecom">Teléfono</Label>
                <Input id="telecom" value={form.telecom} onChange={(e) => handleChange("telecom", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="genero">Género</Label>
                <Select value={form.genero} onValueChange={(v) => handleChange("genero", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Femenino</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fec_nac">Fecha de nacimiento</Label>
                <Input id="fec_nac" type="date" value={form.fec_nac} onChange={(e) => handleChange("fec_nac", e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Preferencias de Notificación
          </CardTitle>
          <CardDescription>Configura qué alertas deseas recibir.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {[
            { key: "alerta_stock_bajo", label: "Alertas de stock bajo", desc: "Avisar cuando un medicamento esté bajo" },
            { key: "reportes_automaticos", label: "Reportes automáticos", desc: "Generar reportes mensuales" },
            { key: "aprobacion_usuarios", label: "Aprobación de usuarios", desc: "Notificar nuevos registros" },
            { key: "alertas_email", label: "Alertas por email", desc: "Enviar copias por correo" },
            { key: "recordatorio_citas", label: "Recordatorio de citas", desc: "Notificar antes de una cita" },
            { key: "resultados_historial", label: "Resultados clínicos", desc: "Notificar nuevos resultados" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={notifPrefs[item.key] ?? false}
                onCheckedChange={(v) => handleNotifToggle(item.key, v)}
                disabled={notifSaving}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Perfil;