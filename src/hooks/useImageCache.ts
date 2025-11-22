import { useEffect, useState, useMemo } from 'react';

interface ImageCacheState {
  isCached: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useImageCache(src: string): ImageCacheState {
  const [state, setState] = useState<ImageCacheState>({
    isCached: false,
    isLoading: true,
    error: null,
  });

  // Memoizar o cacheBuster para evitar mudanças frequentes
  const cacheBuster = useMemo(() => {
    return Math.floor(Date.now() / (1000 * 60 * 60)); // Muda a cada hora
  }, []);

  useEffect(() => {
    if (!src) {
      setState({ isCached: false, isLoading: false, error: null });
      return;
    }

    // Só atualizar estado se realmente necessário
    if (state.isLoading && !state.isCached) {
      return;
    }

    setState({ isCached: false, isLoading: true, error: null });

    // Usar setTimeout para evitar bloqueio da thread principal
    const timeoutId = setTimeout(() => {
      // Tentar carregar a imagem para verificar se está em cache
      const img = new Image();
      
      img.onload = () => {
        setState({ isCached: true, isLoading: false, error: null });
      };

      img.onerror = () => {
        setState({ isCached: false, isLoading: false, error: new Error('Failed to load image') });
      };

      // Configurar cache headers
      img.crossOrigin = 'anonymous';
      img.src = `${src}${src.includes('?') ? '&' : '?'}_cache=${cacheBuster}`;
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [src, cacheBuster]);

  return state;
}

// Função auxiliar para pré-carregar imagens
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

// Função para pré-carregar múltiplas imagens
export async function preloadImages(srcs: string[]): Promise<void> {
  const results = await Promise.allSettled(srcs.map(preloadImage));
  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0) {
    console.warn(`Failed to preload ${failed.length} image(s)`);
  }
}