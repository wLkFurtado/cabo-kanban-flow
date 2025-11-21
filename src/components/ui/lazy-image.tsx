import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = React.memo(({
  src,
  alt,
  className,
  placeholderClassName,
  onLoad,
  onError,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const previousSrcRef = useRef<string | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoizar callbacks para evitar re-renderizações
  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  // Debounce para Intersection Observer
  const debouncedSetImageSrc = useCallback((newSrc: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      setImageSrc(newSrc);
    }, 100); // 100ms debounce para maior estabilidade
  }, []);

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      setImageSrc(null);
      previousSrcRef.current = null;
      return;
    }

    // Não resetar estado se o src for o mesmo
    if (previousSrcRef.current === src) {
      return;
    }

    // Resetar estado apenas quando src mudar realmente
    setIsLoading(true);
    setHasError(false);
    previousSrcRef.current = src;

    // Limpar debounce anterior
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    // Limpar observer anterior
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // Verificar se o navegador suporta Intersection Observer
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Usar debounce para carregar a imagem
              debouncedSetImageSrc(src);
              if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
              }
            }
          });
        },
        {
          rootMargin: '300px', // Aumentado para antecipar o carregamento
          threshold: 0.001 // Threshold menor para maior responsividade
        }
      );

      observerRef.current = observer;

      if (placeholderRef.current) {
        observer.observe(placeholderRef.current);
      }

      return () => {
        observer.disconnect();
        observerRef.current = null;
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
          debounceTimeoutRef.current = null;
        }
      };
    } else {
      // Fallback para navegadores antigos - carregar imediatamente
      debouncedSetImageSrc(src);
    }
  }, [src, debouncedSetImageSrc]);

  return (
    <div className="relative w-full h-full">
      {/* Placeholder - sempre montado e com transição suave de opacidade */}
      <div
        ref={placeholderRef}
        className={cn(
          "absolute inset-0 bg-muted transition-opacity duration-300",
          isLoading ? "opacity-100" : "opacity-0 pointer-events-none",
          placeholderClassName
        )}
        style={{ willChange: 'opacity' }}
      />
      
      {/* Imagem real */}
      {imageSrc && (
        <img
          ref={imageRef}
          src={imageSrc}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            className,
            isLoading || hasError ? "opacity-0" : "opacity-100"
          )}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
          decoding="async"
          crossOrigin="anonymous"
          style={{ willChange: 'opacity', backfaceVisibility: 'hidden' }}
          {...props}
        />
      )}
      
      {/* Ícone de erro - só mostra se deu erro */}
      {hasError && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;