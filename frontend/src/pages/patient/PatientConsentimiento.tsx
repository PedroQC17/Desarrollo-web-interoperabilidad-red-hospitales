import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Info, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const PatientConsentimiento = () => {
  const [consentGiven, setConsentGiven] = useState(false);
  const [shareWithNetwork, setShareWithNetwork] = useState(true);
  const [shareForResearch, setShareForResearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api("/historiales/mi-historial/");
        setConsentGiven(data.activo === true);
        setShareWithNetwork(data.compartir_red === true);
        setShareForResearch(data.investigacion === true);
      } catch {
        toast.error("No se pudo cargar el estado del consentimiento.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleSwitch = async (campo: string, valor: boolean) => {
    setSaving(true);
    try {
      const res = await api("/historiales/consentimiento/", {
        method: "PATCH",
        body: JSON.stringify({ [campo]: valor }),
      });
      if (campo === "compartir_red") setShareWithNetwork(res.compartir_red);
      if (campo === "investigacion") setShareForResearch(res.investigacion);
    } catch {
      toast.error("Error al actualizar la preferencia.");
    } finally {
      setSaving(false);
    }
  };

  const toggleConsentimiento = async () => {
    setSaving(true);
    const nuevoEstado = !consentGiven;
    try {
      const res = await api("/historiales/consentimiento/", {
        method: "PATCH",
        body: JSON.stringify({ aceptado: nuevoEstado }),
      });
      setConsentGiven(res.consentimiento_activo);
      toast.success(res.mensaje || "Consentimiento actualizado.");
    } catch {
      toast.error("Error al actualizar el consentimiento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Consentimiento Informado</h1>
        <p className="text-muted-foreground mt-1">Gestiona cómo se usan y comparten tus datos clínicos.</p>
      </div>

      {/* Status */}
      <Card className={`border-2 ${consentGiven ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}`}>
        <CardContent className="p-6 flex items-center gap-4">
          {consentGiven ? (
            <CheckCircle2 className="w-10 h-10 text-primary flex-shrink-0" />
          ) : (
            <XCircle className="w-10 h-10 text-destructive flex-shrink-0" />
          )}
          <div>
            <h3 className="font-semibold text-foreground text-lg">
              {consentGiven ? "Consentimiento Otorgado" : "Consentimiento Revocado"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {consentGiven
                ? "Has autorizado el uso de tu información clínica dentro de la red hospitalaria."
                : "Tu información clínica no será compartida con la red hospitalaria."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Consent details */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Compartir con la Red Hospitalaria
            </CardTitle>
            <CardDescription>Permite que los médicos de otros hospitales de la red accedan a tu historial clínico.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {shareWithNetwork ? "Activado" : "Desactivado"}
              </span>
              <Switch checked={shareWithNetwork} onCheckedChange={(v) => toggleSwitch("compartir_red", v)} disabled={saving} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-accent" />
              Uso con Fines de Investigación
            </CardTitle>
            <CardDescription>Permite el uso anónimo de tus datos para investigaciones médicas y estadísticas.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {shareForResearch ? "Activado" : "Desactivado"}
              </span>
              <Switch checked={shareForResearch} onCheckedChange={(v) => toggleSwitch("investigacion", v)} disabled={saving} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info card */}
      <Card className="border-border bg-muted/30">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong className="text-foreground">¿Qué implica dar tu consentimiento?</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Los médicos de la red podrán consultar tu historial clínico para brindarte mejor atención.</li>
                <li>Tus datos están protegidos y solo son accesibles por profesionales autorizados.</li>
                <li>Puedes revocar tu consentimiento en cualquier momento desde esta sección.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main toggle */}
      <div className="flex justify-end">
        <Button
          variant={consentGiven ? "destructive" : "default"}
          onClick={toggleConsentimiento}
          disabled={loading || saving}
          className="gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : consentGiven ? (
            <>
              <XCircle className="w-4 h-4" />
              Revocar Consentimiento
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Otorgar Consentimiento
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PatientConsentimiento;
