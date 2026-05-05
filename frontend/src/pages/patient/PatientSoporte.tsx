import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Bot, User } from "lucide-react";
import { useState } from "react";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  time: string;
}

const initialMessages: Message[] = [
  { id: 1, text: "¡Hola! Soy el asistente virtual de SIEHC. ¿En qué puedo ayudarte hoy?", sender: "bot", time: "09:00" },
  { id: 2, text: "Puedo ayudarte con:\n• Información sobre tus citas\n• Dudas sobre tu historial médico\n• Consultas sobre facturación\n• Problemas técnicos con la plataforma", sender: "bot", time: "09:00" },
];

const botResponses: Record<string, string> = {
  cita: "Para solicitar una cita, ve a la sección 'Citas Médicas' desde el menú lateral. Allí podrás seleccionar el hospital, especialidad y médico de tu preferencia.",
  historial: "Puedes consultar tu historial médico en la sección 'Historial Médico'. Ahí encontrarás tus diagnósticos y recetas organizados por fecha.",
  factura: "Tus facturas están disponibles en la sección 'Facturación'. Puedes filtrar por fecha y descargar comprobantes en PDF.",
  receta: "Las recetas emitidas por tus médicos están en tu historial médico, en la pestaña 'Recetas'. Puedes descargarlas en formato PDF.",
};

const PatientSoporte = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now(), text: input, sender: "user", time: new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) };
    setMessages(prev => [...prev, userMsg]);

    const lower = input.toLowerCase();
    const matchedKey = Object.keys(botResponses).find(k => lower.includes(k));
    const botText = matchedKey
      ? botResponses[matchedKey]
      : "Gracias por tu mensaje. Un agente revisará tu consulta pronto. Mientras tanto, ¿puedo ayudarte con algo más?";

    setTimeout(() => {
      const botMsg: Message = { id: Date.now() + 1, text: botText, sender: "bot", time: new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) };
      setMessages(prev => [...prev, botMsg]);
    }, 800);

    setInput("");
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Soporte</h1>
        <p className="text-muted-foreground mt-1">Chatea con nuestro asistente virtual.</p>
      </div>

      <Card className="border-border flex-1 flex flex-col min-h-[500px]">
        {/* Messages */}
        <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : ""}`}>
              {msg.sender === "bot" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                msg.sender === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}>
                <p className="whitespace-pre-line">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${msg.sender === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.time}</p>
              </div>
              {msg.sender === "user" && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}
        </CardContent>

        {/* Input */}
        <div className="border-t border-border p-4">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default PatientSoporte;
