export const KANBAN_WEBHOOK_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_KANBAN_WEBHOOK_URL) ||
  'https://webhooks.growave.com.br/webhook/Kanban';

export async function postWebhook(payload: unknown, url: string = KANBAN_WEBHOOK_URL): Promise<void> {
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Silenciar erros de rede para não interromper a UX
    console.warn('[Webhook] Falha ao enviar webhook:', err);
  }
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