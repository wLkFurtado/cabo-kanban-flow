import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useAttachments } from "../../hooks/useAttachments";
import { Paperclip, Link as LinkIcon } from "lucide-react";

interface AttachmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  cardId: string;
}

export function AttachmentDialog({ open, onOpenChange, boardId, cardId }: AttachmentDialogProps) {
  const { attachments, upload, uploading, addLink } = useAttachments(boardId, cardId);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const recentLinks = useMemo(() => {
    return (attachments || []).filter(a => a.path.startsWith("link/") || a.type.includes("link") || a.type.includes("text/html")).slice(0, 10);
  }, [attachments]);

  const handleFiles = async (files: File[]) => {
    if (!files.length) return;
    await upload(files);
    onOpenChange(false);
  };

  const handleChooseFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    handleFiles(files);
    e.target.value = "";
  };

  const inferDisplayName = (url: string) => {
    try {
      const u = new URL(url);
      return u.hostname;
    } catch {
      return url;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Anexar</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div
            className={`border rounded-md p-4 ${dragOver ? "border-primary" : "border-muted"}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const files = Array.from(e.dataTransfer.files || []); handleFiles(files); }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm">Anexe um arquivo do seu computador</div>
              <input type="file" multiple className="hidden" id="attachment-file-input" onChange={handleChooseFile} />
              <Button size="sm" onClick={() => document.getElementById("attachment-file-input")?.click()} disabled={uploading}>
                Escolher um arquivo
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2">Você também pode arrastar e soltar arquivos para carregá-los.</div>
          </div>

          <div className="space-y-2">
            <div className="text-sm">Pesquise ou cole o link</div>
            <Input placeholder="Cole um link" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
            <div className="text-xs text-muted-foreground">Texto para exibição (opcional)</div>
            <Input placeholder="Texto a ser exibido" value={linkText} onChange={(e) => setLinkText(e.target.value)} />
            <div className="flex justify-end">
              <Button size="sm" onClick={async () => { const url = linkUrl.trim(); if (!url) return; const name = (linkText.trim() || inferDisplayName(url)); await addLink(url, name); onOpenChange(false); }}>Inserir</Button>
            </div>
          </div>

          {recentLinks.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm">Visualizado recentemente</div>
              <div className="space-y-1">
                {recentLinks.map(l => (
                  <div key={l.id} className="flex items-center gap-2 text-sm">
                    <LinkIcon className="h-4 w-4" />
                    <a href={l.url} target="_blank" rel="noreferrer" className="hover:underline truncate">
                      {l.name}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AttachmentDialog;
