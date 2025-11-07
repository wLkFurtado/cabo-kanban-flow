import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getInitials } from "@/state/authStore";
import { Member } from "@/state/kanbanTypes";
import { User, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfiles } from "@/hooks/useProfiles";
import { supabase } from "@/integrations/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useBoardsStore } from "@/state/boards/store";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
  const addActivity = useBoardsStore((s) => s.addActivity);
  const { user } = useAuth();
  const sb = supabase as SupabaseClient;
  const authorName = (user?.user_metadata?.full_name as string) || (user?.email as string) || "Usuário";
  const { toast } = useToast();

  const errorMessage = (err: unknown): string => {
    if (!err) return 'Erro desconhecido';
    if (typeof err === 'string') return err;
    const asObj = err as { message?: unknown; error?: { message?: unknown } };
    const msg = (typeof asObj?.message === 'string' ? asObj.message : undefined)
      || (typeof asObj?.error?.message === 'string' ? asObj.error.message : undefined);
    return msg ?? 'Erro desconhecido';
  };
  
  // Filter users based on search term and exclude already selected members
  const filteredUsers = (profiles || []).filter(user => {
    const name = (user.full_name || user.display_name || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
    const notSelected = !selectedMembers.some(member => member.id === user.id);
    return matchesSearch && notSelected;
  });

  const addMember = async (user: { id: string; full_name?: string; display_name?: string; avatar_url?: string }) => {
    // Persist in Supabase card_members
    const { error } = await supabase
      .from('card_members')
      .insert({ card_id: cardId, user_id: user.id });
    if (error) {
      console.error('Erro ao adicionar membro ao card:', error);
      toast({ title: 'Erro ao adicionar membro', description: error.message, variant: 'destructive' });
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
    setSearchTerm("");
  };

  const removeMember = async (memberId: string) => {
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredUsers.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  {searchTerm ? "Nenhum usuário encontrado" : "Todos os usuários já foram adicionados"}
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <Button
                    key={user.id}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto p-3"
                    onClick={() => {
                      addMember(user);
                      setOpen(false);
                    }}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(user.full_name || user.display_name || 'Usuário')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{user.full_name || user.display_name || 'Usuário'}</span>
                      <span className="text-xs text-muted-foreground">{user.email || ''}</span>
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