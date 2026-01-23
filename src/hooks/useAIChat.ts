import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

export interface AIMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  updated_at: string;
}

const WEBHOOK_URL = "https://webhooks.growave.com.br/webhook/ia-texto";

export function useAIChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // Buscar histórico de conversas do usuário
  const {
    data: messages = [],
    isLoading,
    error,
  } = useQuery<AIMessage[]>({
    queryKey: ["ai-conversations", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("ai_conversations")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as AIMessage[];
    },
    enabled: !!userId,
    staleTime: 0, // Sempre buscar dados frescos
  });

  // Enviar mensagem para IA
  const sendMessageMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      if (!userId) throw new Error("Usuário não autenticado");

      // 1. Salvar mensagem do usuário no banco
      const { data: savedUserMessage, error: saveError } = await supabase
        .from("ai_conversations")
        .insert({
          user_id: userId,
          role: "user",
          content: userMessage,
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // 2. Preparar histórico para o webhook (últimas 20 mensagens)
      const history = messages.slice(-20).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // 3. Enviar para webhook
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          message: userMessage,
          history,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro no webhook: ${response.status} ${response.statusText}`);
      }

      // Pegar resposta como texto primeiro
      const text = await response.text();
      
      if (!text || text.trim() === "") {
        throw new Error("Webhook retornou resposta vazia");
      }

      console.log("Resposta raw do webhook:", text.slice(0, 500));

      // Tentar parsear como JSON
      let data;
      let finalResponse = "";

      try {
        data = JSON.parse(text);
        console.log("Resposta parseada:", data);

        // Validar estrutura básica
        if (data.success === false) {
          throw new Error(`Webhook retornou success=false`);
        }

        // Extrair resposta de várias formas possíveis
        if (data.response) {
          finalResponse = data.response;
          
          // Se response for um JSON string, tentar parsear
          if (typeof finalResponse === 'string' && finalResponse.trim().startsWith('{')) {
            try {
              const innerJson = JSON.parse(finalResponse);
              // Tentar pegar TEXTO FINAL
              finalResponse = innerJson['TEXTO FINAL'] || innerJson.response || finalResponse;
            } catch {
              // Se não conseguir parsear, usar como está
            }
          }
        } else if (data['TEXTO FINAL']) {
          finalResponse = data['TEXTO FINAL'];
        } else {
          finalResponse = text;
        }

      } catch (e) {
        console.error("Erro ao parsear JSON:", text.slice(0, 500));
        // Se não for JSON, usar o texto direto
        finalResponse = text;
      }

      // Extrair "TEXTO FINAL:" se estiver no texto
      if (finalResponse.includes('TEXTO FINAL:')) {
        const parts = finalResponse.split('TEXTO FINAL:');
        if (parts.length > 1) {
          finalResponse = parts[1].trim();
          // Remover possíveis aspas e chaves
          finalResponse = finalResponse.replace(/^["'\s{]+|["'\s}]+$/g, '');
        }
      }

      // Validar se tem conteúdo
      if (!finalResponse || finalResponse.trim() === '' || finalResponse === '[undefined]') {
        throw new Error(`Não foi possível extrair resposta válida. Resposta original: ${text.slice(0, 300)}`);
      }

      console.log("Resposta final extraída:", finalResponse.slice(0, 200));

      // 4. Salvar resposta da IA no banco
      const { error: saveAIError } = await supabase
        .from("ai_conversations")
        .insert({
          user_id: userId,
          role: "assistant",
          content: finalResponse,
        });

      if (saveAIError) throw saveAIError;

      return finalResponse;
    },
    onSuccess: () => {
      // Atualizar lista de mensagens
      queryClient.invalidateQueries({ queryKey: ["ai-conversations", userId] });
    },
    onError: (error) => {
      console.error("Erro ao enviar mensagem:", error);
      toast({
        title: "Erro ao enviar mensagem",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Limpar histórico de conversas
  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("ai_conversations")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-conversations", userId] });
      toast({
        title: "Histórico limpo",
        description: "Todas as conversas foram removidas",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao limpar histórico",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  return {
    messages,
    isLoading,
    error,
    sendMessage: (message: string) => sendMessageMutation.mutateAsync(message),
    isSending: sendMessageMutation.isPending,
    clearHistory: () => clearHistoryMutation.mutateAsync(),
    isClearing: clearHistoryMutation.isPending,
  };
}
