import { useEffect, useMemo, useState } from "react";
import { Calendar, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Seo } from "../components/seo/Seo";
import { formatPhoneBR } from "../lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";
import { Input } from "../components/ui/input";
import { useAgendaInstitucionalScope } from "../hooks/useAgendaInstitucionalScope";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";

type Contact = {
  id?: string;
  instituicao: string;
  sigla: string;
  responsavel: string;
  telefone: string;
};

export default function AgendaInstitucional() {
  const { hasScope } = useAgendaInstitucionalScope();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<Contact>({ instituicao: "", sigla: "", responsavel: "", telefone: "" });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const isEditing = useMemo(() => editingIndex !== null, [editingIndex]);

  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) return contacts;
    
    const search = searchTerm.toLowerCase();
    return contacts.filter(contact => 
      contact.instituicao.toLowerCase().includes(search) ||
      contact.sigla.toLowerCase().includes(search) ||
      contact.responsavel.toLowerCase().includes(search) ||
      contact.telefone.toLowerCase().includes(search)
    );
  }, [contacts, searchTerm]);

  const openAddDialog = () => {
    setEditingIndex(null);
    setForm({ instituicao: "", sigla: "", responsavel: "", telefone: "" });
    setDialogOpen(true);
  };

  const openEditDialog = (index: number) => {
    if (!hasScope) return;
    setEditingIndex(index);
    setForm(contacts[index]);
    setDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    if (!hasScope) return;
    setContactToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!hasScope || !contactToDelete) return;
    
    const { error } = await supabase
      .from('institutional_contacts')
      .delete()
      .eq('id', contactToDelete);

    if (error) {
      toast.error('Erro ao excluir contato');
      console.error('Error deleting contact:', error);
    } else {
      setContacts(prev => prev.filter(c => c.id !== contactToDelete));
      toast.success('Contato excluído com sucesso');
    }
    
    setDeleteDialogOpen(false);
    setContactToDelete(null);
  };

  const handleSave = () => {
    if (!hasScope) return;
    const persist = async () => {
      if (isEditing && editingIndex !== null) {
        const current = contacts[editingIndex];
        // Garantir que o id exista antes de tentar atualizar
        if (!current?.id) {
          setDialogOpen(false);
          return;
        }
        const { data, error } = await supabase
          .from('institutional_contacts')
          .update({
            instituicao: form.instituicao,
            sigla: form.sigla,
            responsavel: form.responsavel,
            telefone: form.telefone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', current.id)
          .select()
          .single();
        if (!error && data) {
          setContacts(prev => prev.map((c, i) => (i === editingIndex ? { ...form, id: current.id } : c)));
        }
      } else {
        const { data, error } = await supabase
          .from('institutional_contacts')
          .insert({
            instituicao: form.instituicao,
            sigla: form.sigla,
            responsavel: form.responsavel,
            telefone: form.telefone,
            created_by: user?.id ?? null,
          })
          .select()
          .single();
        if (!error && data) {
          setContacts(prev => [...prev, { ...form, id: data.id }]);
        }
      }
      setDialogOpen(false);
    };
    void persist();
  };

  useEffect(() => {
    const fetchContacts = async () => {
      const { data, error } = await supabase
        .from('institutional_contacts')
        .select('id, instituicao, sigla, responsavel, telefone, created_at, updated_at')
        .order('instituicao', { ascending: true });
      if (!error) {
        setContacts((data || []).map((d) => ({
          id: d.id,
          instituicao: d.instituicao,
          sigla: d.sigla ?? '',
          responsavel: d.responsavel,
          telefone: d.telefone ?? '',
        })));
      }
      setLoading(false);
    };
    void fetchContacts();
  }, []);

  return (
    <div className="space-y-4">
      <Seo title="Agenda Institucional" description="Lista institucional simples de contatos" />
      <Card className="w-full">
        <CardHeader className="px-6 pb-4 flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-left">
            <Calendar className="w-5 h-5" />
            <span>Agenda Institucional</span>
          </CardTitle>
          {hasScope && (
            <Button className="ml-auto" onClick={openAddDialog}>Adicionar contato</Button>
          )}
        </CardHeader>
        <CardContent className="px-6">
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por secretaria, sigla, responsável ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Secretaria</TableHead>
                  <TableHead>Sigla</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Telefone</TableHead>
                  {hasScope && <TableHead className="w-40">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={hasScope ? 5 : 4} className="text-center py-6">Carregando...</TableCell>
                  </TableRow>
                ) : filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={hasScope ? 5 : 4} className="text-center py-6">
                      {searchTerm ? "Nenhum resultado encontrado para a busca" : "Nenhum contato cadastrado"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContacts.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.instituicao || "—"}</TableCell>
                      <TableCell>{item.sigla || "—"}</TableCell>
                      <TableCell>{item.responsavel || "—"}</TableCell>
                      <TableCell>{formatPhoneBR(item.telefone) || "—"}</TableCell>
                      {hasScope && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(idx)}>Editar</Button>
                            <Button variant="destructive" size="sm" onClick={() => item.id && openDeleteDialog(item.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar contato" : "Adicionar contato"}</DialogTitle>
            <DialogDescription>Informe os dados institucionais abaixo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="instituicao" className="text-sm font-medium">Secretaria</label>
              <Input id="instituicao" value={form.instituicao} onChange={(e) => setForm({ ...form, instituicao: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <label htmlFor="sigla" className="text-sm font-medium">Sigla</label>
              <Input id="sigla" value={form.sigla} onChange={(e) => setForm({ ...form, sigla: e.target.value })} placeholder="ex: IBGE, INEP, MEC" />
            </div>
            <div className="grid gap-2">
              <label htmlFor="responsavel" className="text-sm font-medium">Responsável</label>
              <Input id="responsavel" value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <label htmlFor="telefone" className="text-sm font-medium">Telefone</label>
              <Input id="telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>{isEditing ? "Salvar alterações" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}