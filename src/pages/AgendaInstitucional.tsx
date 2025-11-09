import { useEffect, useMemo, useState } from "react";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Seo } from "../components/seo/Seo";
import { formatPhoneBR } from "../lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { useAdminRole } from "../hooks/useAdminRole";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../integrations/supabase/client";

type Contact = {
  id?: string;
  instituicao: string;
  responsavel: string;
  telefone: string;
};

export default function AgendaInstitucional() {
  const { isAdmin } = useAdminRole();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<Contact>({ instituicao: "", responsavel: "", telefone: "" });
  const [loading, setLoading] = useState(true);

  const isEditing = useMemo(() => editingIndex !== null, [editingIndex]);

  const openAddDialog = () => {
    setEditingIndex(null);
    setForm({ instituicao: "", responsavel: "", telefone: "" });
    setDialogOpen(true);
  };

  const openEditDialog = (index: number) => {
    if (!isAdmin) return;
    setEditingIndex(index);
    setForm(contacts[index]);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!isAdmin) return;
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
        .select('id, instituicao, responsavel, telefone, created_at, updated_at')
        .order('instituicao', { ascending: true });
      if (!error) {
        setContacts((data || []).map((d) => ({
          id: d.id,
          instituicao: d.instituicao,
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
          {isAdmin && (
            <Button className="ml-auto" onClick={openAddDialog}>Adicionar contato</Button>
          )}
        </CardHeader>
        <CardContent className="px-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instituição</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Telefone</TableHead>
                  {isAdmin && <TableHead className="w-28">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 4 : 3} className="text-center py-6">Carregando...</TableCell>
                  </TableRow>
                ) : contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 4 : 3} className="text-center py-6">Nenhum contato cadastrado</TableCell>
                  </TableRow>
                ) : (
                  contacts.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.instituicao || "—"}</TableCell>
                      <TableCell>{item.responsavel || "—"}</TableCell>
                      <TableCell>{formatPhoneBR(item.telefone) || "—"}</TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(idx)}>Editar</Button>
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
              <label htmlFor="instituicao" className="text-sm font-medium">Instituição</label>
              <Input id="instituicao" value={form.instituicao} onChange={(e) => setForm({ ...form, instituicao: e.target.value })} />
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
    </div>
  );
}