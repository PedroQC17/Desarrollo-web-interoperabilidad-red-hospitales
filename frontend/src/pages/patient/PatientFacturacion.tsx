import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, Calendar, Loader2, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Factura {
  id: number;
  tipo: "consulta" | "medicamento";
  fecha_emitida: string;
  descripcion: string;
  monto_total: string | number;
  estado_pago: string;
  cita_id?: number;
  medicamentos?: string;
  hospital?: string;
}

const PatientFacturacion = () => {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("todos");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchFacturas = async () => {
    setLoading(true);
    setError(null);
    try {
      // Obtener facturas de consultas médicas
      const consultasData = await api("/facturacion/");
      const consultas = Array.isArray(consultasData)
        ? consultasData.map((f: any) => ({
            ...f,
            tipo: "consulta",
          }))
        : Array.isArray(consultasData?.results)
        ? consultasData.results.map((f: any) => ({
            ...f,
            tipo: "consulta",
          }))
        : [];

      // Obtener facturas de medicamentos (despachos)
      const medicamentosData = await api("/medicamentos/mis-facturas-medicamentos/");
      const medicamentos = Array.isArray(medicamentosData?.results)
        ? medicamentosData.results.map((d: any) => ({
            id: d.id,
            tipo: "medicamento",
            fecha_emitida: d.fecha_despacho,
            hospital: `Despacho de Medicamentos`,
            descripcion: `${d.items?.length || 0} medicamento(s) despachado(s)`,
            medicamentos: d.items
              ?.map((item: any) => `${item.medicamento_nombre} x${item.cantidad}`)
              .join(", "),
            monto_total: d.total,
            estado_pago: "pagado",
            cita_id: d.cita,
          }))
        : [];

      // Combinar y ordenar por fecha descendente
      const todasLasFacturas = [...consultas, ...medicamentos].sort(
        (a, b) =>
          new Date(b.fecha_emitida).getTime() -
          new Date(a.fecha_emitida).getTime()
      );

      setFacturas(todasLasFacturas);
    } catch (err: any) {
      console.error("Error cargando facturas:", err);
      setError("No se pudieron cargar las facturas.");
      setFacturas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacturas();
  }, []);

  const descargarPDF = async (id: number, tipo: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api"}/facturacion/${id}/pdf/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { toast.error("Error al descargar la factura"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `factura_${tipo}_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Error al descargar la factura");
    }
  };

  const filtered = facturas.filter((f) => {
    if (filterType === "consulta" && f.tipo !== "consulta") return false;
    if (filterType === "medicamento" && f.tipo !== "medicamento") return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      const match = f.descripcion.toLowerCase().includes(q)
        || (f.hospital?.toLowerCase().includes(q))
        || `#${f.id}`.includes(q);
      if (!match) return false;
    }
    if (filtroDesde && f.fecha_emitida && f.fecha_emitida < filtroDesde) return false;
    if (filtroHasta) {
      const hastaFin = new Date(filtroHasta);
      hastaFin.setDate(hastaFin.getDate() + 1);
      if (f.fecha_emitida && f.fecha_emitida >= hastaFin.toISOString().slice(0, 10)) return false;
    }
    return true;
  });

  const totalPagado = filtered
    .filter((f) => f.estado_pago === "pagado")
    .reduce((sum, f) => sum + Number(f.monto_total), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Facturación</h1>
        <p className="text-muted-foreground mt-1">
          Consulta todas tus facturas de consultas médicas y medicamentos.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="flex-1 min-w-[180px]">
          <Input type="text" placeholder="Buscar factura..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <div className="w-[160px]">
          <Input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} />
        </div>
        <div className="w-[160px]">
          <Input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="consulta">Consultas</SelectItem>
            <SelectItem value="medicamento">Medicamentos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              S/ {totalPagado.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Total Pagado</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Facturas</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-muted-foreground">Cargando facturas...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No hay facturas disponibles.</p>
          </div>
        ) : (
          filtered.map((factura) => (
            <Card key={`${factura.tipo}-${factura.id}`} className="border-border">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-5 h-5 text-primary" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">
                          {factura.tipo === "consulta"
                            ? "Consulta"
                            : "Medicamento"}{" "}
                          #{factura.id}
                        </h3>
                        <Badge
                          className={
                            factura.estado_pago === "pagado"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-yellow-100 text-yellow-700 border-yellow-200"
                          }
                        >
                          {factura.estado_pago === "pagado"
                            ? "Pagada"
                            : factura.estado_pago}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {factura.tipo === "consulta" ? "Consulta" : "Medicamento"}
                        </Badge>
                        {factura.cita_id && (
                          <Badge variant="outline" className="text-xs">
                            Cita #{factura.cita_id}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(factura.fecha_emitida).toLocaleDateString(
                          "es-PE",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                        {factura.hospital && ` — ${factura.hospital}`}
                      </p>
                      <p className="text-sm text-foreground/80">
                        {factura.descripcion}
                      </p>
                      {factura.medicamentos && (
                        <div className="mt-2 p-2 bg-secondary/30 rounded text-xs text-muted-foreground">
                          <p className="font-semibold mb-1">Medicamentos:</p>
                          <p>{factura.medicamentos}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-bold text-foreground text-lg whitespace-nowrap">
                      S/ {Number(factura.monto_total).toFixed(2)}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => descargarPDF(factura.id, factura.tipo)} className="gap-1 text-xs h-7">
                      <Download className="w-3 h-3" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PatientFacturacion;
