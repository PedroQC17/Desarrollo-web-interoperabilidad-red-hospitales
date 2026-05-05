import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Bell, Shield, Database, Globe } from "lucide-react";
import { toast } from "sonner";

const AdminConfiguracion = () => {
  const handleSave = () => {
    toast.success("Configuración guardada correctamente");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Configuración del Sistema</h1>
        <p className="text-muted-foreground mt-1">Ajustes generales de la red hospitalaria SIEHC.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Información General
            </CardTitle>
            <CardDescription>Datos institucionales del sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="org">Nombre de la Red</Label>
              <Input id="org" defaultValue="SIEHC - Red Nacional" />
            </div>
            <div>
              <Label htmlFor="email">Email de Contacto</Label>
              <Input id="email" type="email" defaultValue="contacto@siehc.pe" />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono Central</Label>
              <Input id="phone" defaultValue="+51 1 800-SIEHC" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notificaciones
            </CardTitle>
            <CardDescription>Configura las alertas del sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Alertas de stock bajo</p>
                <p className="text-xs text-muted-foreground">Avisar cuando un medicamento esté bajo</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Reportes automáticos</p>
                <p className="text-xs text-muted-foreground">Generar reportes mensuales</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Aprobación de usuarios</p>
                <p className="text-xs text-muted-foreground">Notificar nuevos registros</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Alertas por email</p>
                <p className="text-xs text-muted-foreground">Enviar copias por correo</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Seguridad
            </CardTitle>
            <CardDescription>Políticas de acceso y autenticación.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Autenticación de dos factores</p>
                <p className="text-xs text-muted-foreground">Requerida para administradores</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Sesiones únicas</p>
                <p className="text-xs text-muted-foreground">Un solo dispositivo por usuario</p>
              </div>
              <Switch />
            </div>
            <div>
              <Label htmlFor="timeout">Tiempo de sesión (minutos)</Label>
              <Input id="timeout" type="number" defaultValue="30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Interoperabilidad
            </CardTitle>
            <CardDescription>Integración entre hospitales de la red.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Compartir historiales clínicos</p>
                <p className="text-xs text-muted-foreground">Entre hospitales de la red</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">API HL7 / FHIR habilitada</p>
                <p className="text-xs text-muted-foreground">Estándar internacional</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Sincronización automática</p>
                <p className="text-xs text-muted-foreground">Cada 15 minutos</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Settings className="w-4 h-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
};

export default AdminConfiguracion;
