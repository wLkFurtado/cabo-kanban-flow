import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";

interface ImageViewerDialogProps {
  open: boolean;
  src: string | null;
  alt?: string;
  onOpenChange: (open: boolean) => void;
}

export function ImageViewerDialog({ open, src, alt = "Imagem", onOpenChange }: ImageViewerDialogProps) {
  // Preload for smoother display
  useEffect(() => {
    if (open && src) {
      const img = new Image();
      img.src = src;
    }
  }, [open, src]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Visualizar imagem</DialogTitle>
          <DialogDescription>Clique para abrir em nova aba ou baixar.</DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          {src ? (
            <img
              src={src}
              alt={alt}
              className="block w-full h-auto max-h-[70vh] max-w-full object-contain rounded-md"
            />
          ) : (
            <div className="text-sm text-muted-foreground">Nenhuma imagem disponível</div>
          )}
        </div>
        <DialogFooter className="flex items-center gap-2">
          {src && (
            <a href={src} download target="_blank" rel="noopener noreferrer">
              <Button type="button">Baixar</Button>
            </a>
          )}
          {src && (
            <a href={src} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" type="button">Abrir em nova aba</Button>
            </a>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}