import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";

interface Message {
  id: number;
  contenido: string;
  enviado_por: "paciente" | "sistema";
  fecha_hora: string;
}

const PatientSoporte = () => {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [sending, setSending]     = useState(false);
  const bottomRef                 = useRef<HTMLDivElement>(null);

  const cargarMensajes = async () => {
    setLoading(true);
    try {
      const data = await api("/mensajes/mis-mensajes/");
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarMensajes(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const data = await api("/mensajes/mis-mensajes/", {
        method: "POST",
        body: JSON.stringify({ contenido: input }),
      });
      setMessages(prev => [...prev, data.mensaje, data.respuesta]);
      setInput("");
    } catch {
      // silencioso
    } finally {
      setSending(false);
    }
  };

  const formatHora = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Soporte</h1>
        <p className="text-muted-foreground mt-1">Chatea con nuestro asistente virtual.</p>
      </div>

      <Card className="border-border flex-1 flex flex-col min-h-[500px]">
        <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="max-w-[75%] rounded-2xl px-4 py-3 text-sm bg-muted text-foreground rounded-bl-md">
                <p>¡Hola! Soy el asistente virtual de SIEHC. ¿En qué puedo ayudarte?</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.enviado_por === "paciente" ? "justify-end" : ""}`}>
                {msg.enviado_por !== "paciente" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                  msg.enviado_por === "paciente"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}>
                  <p className="whitespace-pre-line">{msg.contenido}</p>
                  <p className={`text-[10px] mt-1 ${msg.enviado_por === "paciente" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {formatHora(msg.fecha_hora)}
                  </p>
                </div>
                {msg.enviado_por === "paciente" && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </CardContent>

        <div className="border-t border-border p-4">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1"
              disabled={sending}
            />
            <Button type="submit" size="icon" disabled={sending}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default PatientSoporte;