/**
 * Utilitários para otimização de imagens
 * Gera URLs de miniaturas usando Supabase Storage Transformations
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

/**
 * Gera URL de miniatura para uma imagem do Supabase Storage
 * @param originalUrl - URL original da imagem
 * @param width - Largura desejada (default: 200)
 * @param quality - Qualidade (1-100, default: 60)
 * @returns URL da miniatura ou URL original se não for possível transformar
 */
export function getThumbnailUrl(
  originalUrl: string | undefined | null,
  width: number = 200,
  quality: number = 60
): string | undefined {
  if (!originalUrl) return undefined;
  
  // Se não for URL do Supabase Storage, retorna original
  if (!originalUrl.includes('supabase') || !originalUrl.includes('/storage/')) {
    return originalUrl;
  }

  try {
    const url = new URL(originalUrl);
    
    // Supabase Storage transform: adiciona query params para resize
    // Formato: /storage/v1/render/image/{bucket}/{path}?width=X&quality=Y
    if (url.pathname.includes('/storage/v1/object/')) {
      // Transforma de /storage/v1/object/public/bucket/path
      // para /storage/v1/render/image/public/bucket/path?width=X&quality=Y
      const newPath = url.pathname.replace('/storage/v1/object/', '/storage/v1/render/image/');
      url.pathname = newPath;
      url.searchParams.set('width', String(width));
      url.searchParams.set('quality', String(quality));
      return url.toString();
    }
    
    return originalUrl;
  } catch {
    return originalUrl;
  }
}

/**
 * Processa array de imagens e retorna versões em miniatura
 * @param images - Array de URLs de imagens
 * @param width - Largura das miniaturas
 * @returns Array de URLs de miniaturas
 */
export function getThumbnailUrls(
  images: string[] | undefined | null,
  width: number = 200
): string[] {
  if (!images || images.length === 0) return [];
  return images.map(url => getThumbnailUrl(url, width) || url);
}

/**
 * Constantes para tamanhos padrão
 */
export const IMAGE_SIZES = {
  CARD_COVER: 300,      // Capa do card na listagem
  CARD_MODAL: 800,      // Imagem no modal do card
  AVATAR: 100,          // Avatar de usuário
  THUMBNAIL: 200,       // Miniatura genérica
} as const;
