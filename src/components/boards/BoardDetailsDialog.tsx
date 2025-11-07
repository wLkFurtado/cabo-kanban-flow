import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useBoardsStore } from "@/state/boards/store";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomFieldsManager } from "@/components/boards/CustomFieldsManager";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Image } from "lucide-react";

interface BoardDetailsDialogProps {
  boardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BoardDetailsDialog({ boardId, open, onOpenChange }: BoardDetailsDialogProps) {
  const board = useBoardsStore((s) => s.boards[boardId]);
  const updateBoard = useBoardsStore((s) => s.updateBoard);
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string>("");
  const [coverImageUrl, setCoverImageUrl] = useState<string>("");
  const [coverColor, setCoverColor] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (open && board) {
      setTitle(board.title || "");
      setIcon(board.icon || "");
      setDescription(board.description || "");
      setColor(board.color || "");
      setCoverImageUrl(board.coverImageUrl || "");
      setCoverColor(board.coverColor || "");
    }
  }, [open, boardId, board]);

  if (!board) return null;

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: "Erro", description: "Por favor, selecione apenas arquivos de imagem.", variant: "destructive" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Erro", description: "A imagem deve ter no máximo 5MB.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${boardId}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('board-covers')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('board-covers')
        .getPublicUrl(fileName);

      setCoverImageUrl(publicUrl);
      setCoverColor(""); // Clear color when image is set
      toast({ title: "Imagem carregada com sucesso!" });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: "Erro", description: "Falha ao carregar a imagem.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const removeCoverImage = () => {
    setCoverImageUrl("");
  };

  const onSave = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    updateBoard(boardId, {
      title: trimmed,
      icon: icon?.trim() || undefined,
      description: description?.trim() || undefined,
      color: color || undefined,
      coverImageUrl: coverImageUrl || undefined,
      coverColor: coverColor || undefined,
    });
    toast({ title: "Detalhes atualizados" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar detalhes do board</DialogTitle>
          <DialogDescription>Atualize informações do seu board.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="fields">Campos personalizados</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-6 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Emoji</label>
                <Input
                  aria-label="Emoji do board"
                  placeholder="😀"
                  value={icon}
                  maxLength={2}
                  onChange={(e) => setIcon(e.target.value)}
                />
              </div>
              <div className="col-span-4">
                <label className="block text-sm font-medium mb-1">Título</label>
                <Input
                  aria-label="Título do board"
                  placeholder="Nome do board"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSave()}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <Textarea
                aria-label="Descrição do board"
                placeholder="Sobre o que é este board?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Cor</label>
              <div className="flex items-center gap-3">
                <input
                  aria-label="Cor do board"
                  type="color"
                  value={color || "#7c3aed"}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-12 rounded-md border border-input bg-background p-1"
                />
                <Input
                  aria-label="Cor em texto"
                  placeholder="#7c3aed ou hsl(262, 83%, 58%)"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Capa do Board</label>
              <div className="space-y-3">
                {/* Cover Image Upload */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-2">Imagem de Capa</label>
                  {coverImageUrl ? (
                    <div className="relative">
                      <img
                        src={coverImageUrl}
                        alt="Capa do board"
                        className="w-full h-32 object-cover rounded-md border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={removeCoverImage}
                        className="absolute top-2 right-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-6 text-center">
                      <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">Nenhuma imagem selecionada</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('cover-upload')?.click()}
                        disabled={isUploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploading ? 'Enviando...' : 'Escolher Imagem'}
                      </Button>
                      <input
                        id="cover-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                {/* Cover Color */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-2">Cor de Fundo (quando não há imagem)</label>
                  <div className="flex items-center gap-3">
                    <input
                      aria-label="Cor da capa"
                      type="color"
                      value={coverColor || "#7c3aed"}
                      onChange={(e) => setCoverColor(e.target.value)}
                      className="h-9 w-12 rounded-md border border-input bg-background p-1"
                    />
                    <Input
                      aria-label="Cor da capa em texto"
                      placeholder="#7c3aed ou hsl(262, 83%, 58%)"
                      value={coverColor}
                      onChange={(e) => setCoverColor(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>


          <TabsContent value="fields">
            <CustomFieldsManager boardId={boardId} />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
