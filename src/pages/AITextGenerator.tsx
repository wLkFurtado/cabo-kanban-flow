import React, { useRef, useEffect } from "react";
import { GradientAIChatInput } from "@/components/ui/GradientAIChatInput";
import { ChatMessage } from "@/components/ai/ChatMessage";
import { useAIChat } from "@/hooks/useAIChat";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function AITextGenerator() {
  const { messages, isLoading, sendMessage, isSending, clearHistory, isClearing } = useAIChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (message: string) => {
    try {
      await sendMessage(message);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Gerador de Texto com IA</h1>
          <p className="text-muted-foreground">
            Digite sua mensagem e deixe a IA ajudar você!
          </p>
          
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearHistory()}
              disabled={isClearing}
              className="mt-4"
            >
              {isClearing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Limpar Histórico
            </Button>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto mb-6 bg-muted/20 rounded-lg p-4 border">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <p className="text-muted-foreground text-lg mb-2">
                Nenhuma conversa ainda
              </p>
              <p className="text-sm text-muted-foreground">
                Envie uma mensagem para começar!
              </p>
            </motion.div>
          ) : (
            <>
              {messages.map((message, index) => (
                <ChatMessage key={message.id} message={message} index={index} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}

          {/* Loading indicator while sending */}
          {isSending && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 mb-4"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-muted text-foreground rounded-2xl rounded-tl-none px-4 py-2">
                <p className="text-sm">IA está pensando...</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <GradientAIChatInput
          placeholder="Digite sua mensagem..."
          onSend={handleSend}
          disabled={isSending}
        />
      </div>
    </div>
  );
}
