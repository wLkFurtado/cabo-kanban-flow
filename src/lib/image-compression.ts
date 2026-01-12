import imageCompression from 'browser-image-compression';

/**
 * Opções de compressão de imagens
 */
export interface CompressionOptions {
  /** Tamanho máximo em MB (padrão: 1) */
  maxSizeMB?: number;
  /** Largura ou altura máxima em pixels (padrão: 1920) */
  maxWidthOrHeight?: number;
  /** Usar Web Worker para não bloquear a UI (padrão: true) */
  useWebWorker?: boolean;
  /** Callback de progresso (0-100) */
  onProgress?: (progress: number) => void;
}

/**
 * Resultado da compressão
 */
export interface CompressionResult {
  /** Arquivo comprimido */
  file: File;
  /** Tamanho original em bytes */
  originalSize: number;
  /** Tamanho comprimido em bytes */
  compressedSize: number;
  /** Porcentagem de redução */
  reductionPercent: number;
}

/**
 * Comprime uma imagem para otimizar upload e armazenamento
 * 
 * @param file - Arquivo de imagem para comprimir
 * @param options - Opções de compressão
 * @returns Resultado da compressão
 * 
 * @example
 * ```ts
 * const result = await compressImage(imageFile, {
 *   maxSizeMB: 1,
 *   onProgress: (p) => console.log(`${p}%`)
 * });
 * console.log(`Reduziu ${result.reductionPercent}%`);
 * ```
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxSizeMB = 1,
    maxWidthOrHeight = 1920,
    useWebWorker = true,
    onProgress,
  } = options;

  const originalSize = file.size;

  // Se a imagem já é pequena, não precisa comprimir
  if (originalSize <= maxSizeMB * 1024 * 1024) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      reductionPercent: 0,
    };
  }

  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker,
      onProgress,
      // Manter orientação EXIF
      exifOrientation: 1,
      // Preservar metadados importantes
      preserveExif: false, // False para reduzir tamanho
      // Qualidade inicial alta
      initialQuality: 0.85,
    });

    const compressedSize = compressedFile.size;
    const reductionPercent = Math.round(
      ((originalSize - compressedSize) / originalSize) * 100
    );

    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      reductionPercent,
    };
  } catch (error) {
    console.error('Erro ao comprimir imagem:', error);
    // Em caso de erro, retornar arquivo original
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      reductionPercent: 0,
    };
  }
}

/**
 * Gera um thumbnail de uma imagem
 * 
 * @param file - Arquivo de imagem
 * @param size - Tamanho do thumbnail (padrão: 300)
 * @returns File do thumbnail
 */
export async function generateThumbnail(
  file: File,
  size: number = 300
): Promise<File> {
  try {
    const thumbnail = await imageCompression(file, {
      maxSizeMB: 0.1, // Thumbnails muito pequenos
      maxWidthOrHeight: size,
      useWebWorker: true,
      initialQuality: 0.7,
      preserveExif: false,
    });

    // Renomear para indicar que é thumbnail
    const newName = file.name.replace(/(\.[^.]+)$/, '_thumb$1');
    return new File([thumbnail], newName, { type: file.type });
  } catch (error) {
    console.error('Erro ao gerar thumbnail:', error);
    throw error;
  }
}

/**
 * Formata bytes para formato legível
 * 
 * @param bytes - Quantidade de bytes
 * @returns String formatada (ex: "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Verifica se um arquivo é uma imagem
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Valida tamanho máximo de arquivo
 */
export function validateFileSize(
  file: File,
  maxSizeMB: number
): { valid: boolean; message?: string } {
  const maxBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxBytes) {
    return {
      valid: false,
      message: `Arquivo muito grande. Máximo: ${formatBytes(maxBytes)}. Tamanho atual: ${formatBytes(file.size)}`,
    };
  }

  return { valid: true };
}
