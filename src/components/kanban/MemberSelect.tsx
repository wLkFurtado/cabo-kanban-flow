import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { getInitials } from "@/lib/utils";
import { Member } from "../../state/kanbanTypes";
import { UserPlus, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { useProfiles } from "../../hooks/useProfiles";
import type { Profile } from "../../hooks/useProfiles";
import { supabase } from "../../integrations/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useBoardsStore } from "../../state/boards/store";
import type { BoardsStore } from "../../state/boards/types";
import { useAuth } from "../../hooks/useAuth";
import { useAdminRole } from "../../hooks/useAdminRole";
import { useToast } from "../../hooks/use-toast";
import { postWebhook } from "../../lib/webhook";
import type { ChangeEvent } from "react";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

interface MemberSelectProps {
  selectedMembers: Member[];
  onMembersChange: (members: Member[]) => void;
  className?: string;
  cardId: string;
  boardId: string;
}

export function MemberSelect({ selectedMembers, onMembersChange, className, cardId, boardId }: MemberSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const { profiles } = useProfiles();
  const addActivity = useBoardsStore((s: BoardsStore) => s.addActivity);
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const sb = supabase as SupabaseClient;
  const authorName = (user?.user_metadata?.full_name as string) || (user?.email as string) || "Usuário";
  const { toast } = useToast();
  const [boardMemberIds, setBoardMemberIds] = useState<string[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const isOnline = useOnlineStatus();

  // Removido: checagem de permissão do lado do cliente.
  // Agora confiamos totalmente nas políticas RLS do banco para permitir/negAR ações
  // e exibimos mensagens de erro adequadas quando necessário.

  // Carregar os membros vinculados ao board (e o dono) para limitar as opções
  useEffect(() => {
    let mounted = true;
    const loadMembers = async () => {
      if (!isOnline) {
        if (mounted) {
          setOwnerId(null);
          setBoardMemberIds([]);
        }
        return;
      }
      try {
        const { data: boardRow } = await supabase
          .from('boards')
          .select('owner_id')
          .eq('id', boardId)
          .maybeSingle();
        if (mounted) setOwnerId(boardRow?.owner_id ?? null);
      } catch {
        if (mounted) setOwnerId(null);
      }

      try {
        const { data, error } = await supabase
          .from('board_members')
          .select('user_id')
          .eq('board_id', boardId);
        if (!error && mounted) {
          setBoardMemberIds((data || []).map(r => r.user_id));
        } else if (mounted) {
          setBoardMemberIds([]);
        }
      } catch {
        if (mounted) setBoardMemberIds([]);
      }
    };
    if (boardId) loadMembers();
    return () => { mounted = false; };
  }, [boardId, isOnline]);

  const errorMessage = (err: unknown): string => {
    if (!err) return 'Erro desconhecido';
    if (typeof err === 'string') return err;
    const asObj = err as { message?: unknown; error?: { message?: unknown } };
    const msg = (typeof asObj?.message === 'string' ? asObj.message : undefined)
      || (typeof asObj?.error?.message === 'string' ? asObj.error.message : undefined);
    return msg ?? 'Erro desconhecido';
  };
  
  // Filter users based on search term and exclude already selected members
  const filteredUsers = (profiles || []).filter((u: Profile) => {
    const isLinkedToBoard = boardMemberIds.includes(u.id) || (!!ownerId && u.id === ownerId);
    const name = (u.full_name || u.display_name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
    const notSelected = !selectedMembers.some(member => member.id === u.id);
    return isLinkedToBoard && matchesSearch && notSelected;
  });

  const addMember = async (user: { id: string; full_name?: string; display_name?: string; avatar_url?: string }) => {
    if (!isOnline) {
      toast({ title: 'Sem conexão', description: 'Conecte-se à internet para adicionar membros.', variant: 'destructive' });
      return;
    }
    // Persist in Supabase card_members
    const { error } = await supabase
      .from('card_members')
      .insert({ card_id: cardId, user_id: user.id });
    if (error) {
      console.error('Erro ao adicionar membro ao card:', error);
      const msg = String(error.message || '').toLowerCase();
      const isRLSDenied = msg.includes('not authorized') || msg.includes('violates row level security') || msg.includes('permission') || msg.includes('rls');
      toast({
        title: isRLSDenied ? 'Sem permissão' : 'Erro ao adicionar membro',
        description: isRLSDenied
          ? 'Você não é membro deste board. Peça ao administrador para adicioná-lo ao board para poder gerenciar membros do card.'
          : error.message,
        variant: 'destructive',
      });
      return;
    }
    const newMember: Member = {
      id: user.id,
      name: user.full_name || user.display_name || 'Usuário',
      avatar: user.avatar_url || undefined,
    };
    onMembersChange([...selectedMembers, newMember]);
    // Invalidate members query for this board
    queryClient.invalidateQueries({ queryKey: ['card-members', boardId] });
    
    // Log de atividade apenas local
    try {
      addActivity(boardId, cardId, authorName, 'member_added', `adicionou ${newMember.name} a este card`);
      await sb.from('card_activities').insert({
        board_id: boardId,
        card_id: cardId,
        user_id: user?.id,
        type: 'member_added',
        description: `adicionou ${newMember.name} a este card`,
      });
      // Atualizar imediatamente atividades do card
      queryClient.invalidateQueries({ queryKey: ['card-activities', cardId] });
      toast({ title: 'Atividade registrada', description: `Membro ${newMember.name} adicionado.` });
    } catch (activityErr) {
      console.warn('Falha ao registrar atividade de adição de membro:', activityErr);
      toast({ title: 'Falha ao registrar atividade', description: errorMessage(activityErr), variant: 'destructive' });
    }
    // Webhook: membro adicionado
    try {
      const profile = profiles.find((p: Profile) => p.id === user.id);
      await postWebhook({
        event: 'member_added',
        boardId,
        cardId,
        member: {
          id: user.id,
          name: newMember.name,
          avatar: newMember.avatar,
          phone: profile?.phone ?? null,
          cargo: profile?.cargo ?? null,
        },
        members: [...selectedMembers, newMember].map(m => {
          const p = profiles.find((pf: Profile) => pf.id === m.id);
          return { id: m.id, name: m.name, avatar: m.avatar, phone: p?.phone ?? null, cargo: p?.cargo ?? null };
        }),
      });
    } catch (e) {
      console.warn('[Webhook] erro ao enviar member_added:', e);
    }
    setSearchTerm("");
  };

  const removeMember = async (memberId: string) => {
    if (!isOnline) {
      toast({ title: 'Sem conexão', description: 'Conecte-se à internet para remover membros.', variant: 'destructive' });
      return;
    }
    const { error } = await supabase
      .from('card_members')
      .delete()
      .eq('card_id', cardId)
      .eq('user_id', memberId);
    if (error) {
      console.error('Erro ao remover membro do card:', error);
      toast({ title: 'Erro ao remover membro', description: error.message, variant: 'destructive' });
      return;
    }
    const removedMember = selectedMembers.find(m => m.id === memberId);
    onMembersChange(selectedMembers.filter(member => member.id !== memberId));
    queryClient.invalidateQueries({ queryKey: ['card-members', boardId] });
    
    // Log de atividade apenas local
    try {
      const targetName = removedMember?.name || 'membro';
      addActivity(boardId, cardId, authorName, 'member_removed', `removeu ${targetName} deste card`);
      await sb.from('card_activities').insert({
        board_id: boardId,
        card_id: cardId,
        user_id: user?.id,
        type: 'member_removed',
        description: `removeu ${targetName} deste card`,
      });
      // Atualizar imediatamente atividades do card
      queryClient.invalidateQueries({ queryKey: ['card-activities', cardId] });
      toast({ title: 'Atividade registrada', description: `Membro ${targetName} removido.` });
    } catch (activityErr) {
      console.warn('Falha ao registrar atividade de remoção de membro:', activityErr);
      toast({ title: 'Falha ao registrar atividade', description: errorMessage(activityErr), variant: 'destructive' });
    }
    // Webhook: membro removido
    try {
      const profile = profiles.find((p: Profile) => p.id === memberId);
      await postWebhook({
        event: 'member_removed',
        boardId,
        cardId,
        member: removedMember 
          ? { id: removedMember.id, name: removedMember.name, avatar: removedMember.avatar, phone: profile?.phone ?? null, cargo: profile?.cargo ?? null }
          : { id: memberId, name: 'Usuário', phone: profile?.phone ?? null, cargo: profile?.cargo ?? null },
        members: selectedMembers
          .filter(m => m.id !== memberId)
          .map(m => {
            const p = profiles.find((pf: Profile) => pf.id === m.id);
            return { id: m.id, name: m.name, avatar: m.avatar, phone: p?.phone ?? null, cargo: p?.cargo ?? null };
          }),
      });
    } catch (e) {
      console.warn('[Webhook] erro ao enviar member_removed:', e);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Label>Membros</Label>
      
      {/* Selected Members */}
      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMembers.map((member) => (
            <Badge key={member.id} variant="secondary" className="flex items-center gap-2 pr-1">
              <Avatar className="h-5 w-5">
                <AvatarImage src={member.avatar} />
                <AvatarFallback className="text-xs">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{member.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => removeMember(member.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add Member Button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Adicionar Membro
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-3">
            <div>
              <Label htmlFor="member-search">Buscar usuário</Label>
              <Input
                id="member-search"
                placeholder="Nome ou email..."
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="mt-1"
                />
            </div>
            
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredUsers.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  {searchTerm
                    ? "Nenhum usuário encontrado"
                    : boardMemberIds.length === 0
                      ? "Este board ainda não possui membros"
                      : "Todos os membros do board já foram adicionados"}
                </div>
              ) : (
                filteredUsers.map((u: Profile) => (
                  <Button
                    key={u.id}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto p-3"
                    onClick={() => {
                      addMember({ id: u.id, full_name: u.full_name || undefined, display_name: u.display_name || undefined, avatar_url: u.avatar_url || undefined });
                      setOpen(false);
                    }}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={u.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(u.full_name || u.display_name || 'Usuário')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{u.full_name || u.display_name || 'Usuário'}</span>
                      <span className="text-xs text-muted-foreground">{u.email || ''}</span>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}