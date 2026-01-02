export const KANBAN_WEBHOOK_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_KANBAN_WEBHOOK_URL) ||
  'https://webhooks.growave.com.br/webhook/Kanban';

// Queue para agrupar webhooks e enviar em lote
type WebhookPayload = {
  payload: unknown;
  url: string;
};

let webhookQueue: WebhookPayload[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 1000; // Aguarda 1 segundo antes de enviar

// Envia todos os webhooks acumulados de uma vez
async function flushWebhookQueue(): Promise<void> {
  if (webhookQueue.length === 0) return;
  
  const queueToSend = [...webhookQueue];
  webhookQueue = [];
  flushTimeout = null;

  // Agrupar por URL
  const byUrl = new Map<string, unknown[]>();
  for (const item of queueToSend) {
    const existing = byUrl.get(item.url) || [];
    existing.push(item.payload);
    byUrl.set(item.url, existing);
  }

  // Enviar para cada URL
  for (const [url, payloads] of byUrl.entries()) {
    try {
      // Se tiver múltiplos payloads, envia como batch
      const body = payloads.length === 1 ? payloads[0] : { batch: true, events: payloads };
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.warn('[Webhook] Falha ao enviar webhook batch:', err);
    }
  }
}

/**
 * Envia webhook com debounce - agrupa chamadas próximas para reduzir requests
 * @param payload - Dados a enviar
 * @param url - URL do webhook (opcional, usa default)
 * @param immediate - Se true, envia imediatamente sem debounce
 */
export async function postWebhook(
  payload: unknown, 
  url: string = KANBAN_WEBHOOK_URL,
  immediate: boolean = false
): Promise<void> {
  // Se immediate, envia diretamente sem fila
  if (immediate) {
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('[Webhook] Falha ao enviar webhook:', err);
    }
    return;
  }

  // Adiciona à fila
  webhookQueue.push({ payload, url });

  // Reseta o timer de debounce
  if (flushTimeout) {
    clearTimeout(flushTimeout);
  }

  // Agenda envio após DEBOUNCE_MS
  flushTimeout = setTimeout(() => {
    flushWebhookQueue();
  }, DEBOUNCE_MS);
}

// Força envio imediato da fila (útil em beforeunload)
export function flushWebhooks(): void {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  flushWebhookQueue();
}

export type WebhookMember = {
  id: string;
  name: string;
  avatar?: string;
  phone?: string | null;
  cargo?: string | null;
};

export type WebhookLabel = {
  id: string;
  name: string;
  color: string;
};

declare global {
  interface ImportMetaEnv {
    readonly VITE_KANBAN_WEBHOOK_URL?: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}