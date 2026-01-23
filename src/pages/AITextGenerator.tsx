import React, { useState } from "react";
import { GradientAIChatInput } from "@/components/ui/GradientAIChatInput";

export default function AITextGenerator() {
  const [messages, setMessages] = useState<string[]>([]);

  const handleSend = (message: string) => {
    console.log("Mensagem enviada:", message);
    setMessages((prev) => [...prev, message]);
    // Aqui você pode adicionar lógica para enviar para API de IA
  };

  return (
    <div className="min-h-screen bg-background p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full space-y-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">Gerador de Texto com IA</h1>
          <p className="text-muted-foreground">
            Digite sua mensagem e deixe a IA ajudar você!
          </p>
        </div>

        <GradientAIChatInput
          placeholder="Digite sua mensagem..."
          onSend={handleSend}
        />

        {/* Preview das mensagens (opcional) */}
        {messages.length > 0 && (
          <div className="mt-8 space-y-2">
            <h3 className="text-lg font-semibold">Mensagens Enviadas:</h3>
            {messages.map((msg, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-muted/50 text-sm"
              >
                {msg}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
