import { supabase } from '../integrations/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import { useToast } from '../components/ui/use-toast';

const sb = supabase as SupabaseClient;

function dataUrlToBlob(dataUrl: string): { blob: Blob; mime: string; ext: string; sizeBytes: number } {
  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!match) {
    throw new Error('Formato de data URL inválido');
  }
  const mime = match[1];
  const b64 = match[2];
  const byteChars = atob(b64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mime });
  const ext = mime.split('/')[1] || 'png';
  return { blob, mime, ext, sizeBytes: byteArray.byteLength };
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function useCoversMigration() {
  const { toast } = useToast();

  const migrateBoardCardCovers = async (boardId: string) => {
    try {
      toast({ title: 'Migração iniciada', description: 'Convertendo capas para Storage…' });

      const { data: lists, error: listsErr } = await sb
        .from('board_lists')
        .select('id')
        .eq('board_id', boardId);
      if (listsErr) throw listsErr;
      const listIds = (lists ?? []).map((l: { id: string }) => l.id);
      if (listIds.length === 0) {
        toast({ title: 'Sem listas', description: 'Nenhuma lista encontrada neste board.' });
        return;
      }

      const { data: cards, error: cardsErr } = await sb
        .from('cards')
        .select('id, list_id, cover_images')
        .in('list_id', listIds);
      if (cardsErr) throw cardsErr;

      const MAX = 13 * 1024 * 1024; // 13MB
      let migratedCards = 0;
      let migratedImages = 0;

      for (const card of (cards ?? [])) {
        const images: string[] = Array.isArray(card.cover_images) ? card.cover_images : [];
        if (!images.length) continue;

        const newImages: string[] = [];
        let changed = false;

        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          if (typeof img === 'string' && img.startsWith('data:image/')) {
            try {
              const { blob, mime, ext, sizeBytes } = dataUrlToBlob(img);
              if (sizeBytes > MAX) {
                // Skip oversized base64
                newImages.push(img);
                continue;
              }
              const path = `boards/${boardId}/cards/${card.id}/${Date.now()}_${sanitize(`cover_${i}.${ext}`)}`;
              const bucket = sb.storage.from('card-covers');
              const { error: upErr } = await bucket.upload(path, blob, { contentType: mime });
              if (upErr) {
                newImages.push(img); // keep original if upload failed
                continue;
              }
              const { data: pub } = bucket.getPublicUrl(path);
              if (pub?.publicUrl) {
                newImages.push(pub.publicUrl);
                migratedImages++;
                changed = true;
              } else {
                newImages.push(img);
              }
            } catch {
              newImages.push(img);
            }
          } else {
            newImages.push(img);
          }
        }

        if (changed) {
          const { error: updErr } = await sb
            .from('cards')
            .update({ cover_images: newImages, updated_at: new Date().toISOString() })
            .eq('id', card.id);
          if (!updErr) {
            migratedCards++;
          }
        }
      }

      toast({
        title: 'Migração concluída',
        description: `Capas migradas: ${migratedImages} imagens em ${migratedCards} cards.`
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: 'Erro na migração', description: msg, variant: 'destructive' });
    }
  };

  return { migrateBoardCardCovers };
}