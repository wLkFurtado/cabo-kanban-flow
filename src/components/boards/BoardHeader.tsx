import { Star, Users } from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Progress } from "../ui/progress";
import { EditableText } from "../editable/EditableText";
import { BoardActions } from "./BoardActions";
import type { Board, Card } from "../../state/kanbanTypes";
import { useBoardsStore } from "../../state/boards/store";
import { useEffect, useRef, useState, ChangeEvent } from "react";
import { supabase } from "../../integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useToast } from "../../hooks/use-toast";

interface BoardHeaderProps {
  board: Board;
  onDeleted: () => void;
}

// Tipo para a linha retornada pelo join em board_members -> profiles
type BoardMemberRow = {
  user_id: string;
  profiles: {
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
};

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Erro inesperado";
}

export function BoardHeader({ board, onDeleted }: BoardHeaderProps) {
  const updateBoardTitle = useBoardsStore((s: { updateBoardTitle: (id: string, title: string) => void }) => s.updateBoardTitle);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const { toast } = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [members, setMembers] = useState<Array<{ id: string; name: string; avatar: string | null }>>([]);
  const [allUsers, setAllUsers] = useState<Array<{ id: string; name: string; email: string | null; avatar: string | null }>>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Verifica se é o board de solicitação de arte (ID específico ou template)
  const isSolicitacaoArte = board.id === "b_q1lk2c5be4" || board.isTemplate;
  
  // Calculate progress based on completed cards
  const allCards: Card[] = Object.values(board.cardsByList).reduce<Card[]>((acc, arr) => acc.concat(arr), [] as Card[]);
  const totalCards = allCards.length;
  const completedCards = allCards.filter((card: Card) => card.dueDate && new Date(card.dueDate) < new Date()).length;
  const progress = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;

  // Load real board members from Supabase
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        console.log('🔍 [DEBUG] Fetching members for board:', board.id);
        const { data, error } = await supabase
          .from('board_members')
          .select('user_id, profiles:profiles!inner(full_name, avatar_url)')
          .eq('board_id', board.id);

      if (error) throw error;

      console.log('✅ [DEBUG] Board members data:', data);
      const rows: BoardMemberRow[] = (data ?? []) as BoardMemberRow[];
      const mapped = rows.map((row) => ({
        id: row.user_id,
        name: row.profiles?.full_name ?? 'Usuário',
        avatar: row.profiles?.avatar_url ?? null,
      }));
      console.log('✅ [DEBUG] Mapped members:', mapped);
      setMembers(mapped);
      } catch (err) {
        console.error('❌ [DEBUG] Erro ao carregar membros do board:', err);
      }
    };
    fetchMembers();
  }, [board.id]);

  // Load all registered users (profiles) when dialog opens
  useEffect(() => {
    if (!inviteOpen) return;
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .order('full_name', { ascending: true });
        if (error) throw error;
        const mapped = (data ?? []).map((p: { id: string; full_name: string | null; email: string | null; avatar_url: string | null }) => ({
          id: p.id,
          name: p.full_name ?? 'Usuário',
          email: p.email ?? null,
          avatar: p.avatar_url ?? null,
        }));
        setAllUsers(mapped);
      } catch (err) {
        console.error('Erro ao carregar usuários:', err);
        toast({ title: 'Erro ao carregar usuários', description: getErrorMessage(err), variant: 'destructive' });
      }
    };
    fetchUsers();
  }, [inviteOpen, toast]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="relative z-10 space-y-4 pb-6 border-b bg-transparent">

      {/* First row: Title, favorite, members, actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 ref={titleRef} className="text-2xl font-bold tracking-tight">
                {isSolicitacaoArte ? (
                  "SOLICITAÇÃO DE ARTE"
                ) : (
                  <EditableText 
                    value={board.title} 
                    onSubmit={(v: string) => updateBoardTitle(board.id, v)} 
                  />
                )}
              </h1>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-warning">
                <Star size={16} />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Team members */}
          <div className="flex items-center gap-1">
            {members.slice(0, 3).map((member, index) => (
              <Avatar key={member.id} className="h-8 w-8 border-2 border-background" style={{ marginLeft: index > 0 ? '-8px' : '0' }}>
                <AvatarImage src={member.avatar || undefined} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
            ))}
            <Button variant="outline" size="sm" className="h-8 ml-2" onClick={() => setInviteOpen(true)}>
              <Users size={14} className="mr-1" />
              Convidar
            </Button>
          </div>
          {/* Compartilhar removido conforme solicitado */}
          
          {!isSolicitacaoArte && (
            <BoardActions
              boardId={board.id}
              onRename={() => {
                const btn = titleRef.current?.querySelector(
                  'button[aria-label="Editar texto"]'
                ) as HTMLButtonElement | null;
                btn?.click();
              }}
              onDeleted={onDeleted}
            />
          )}
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar membros cadastrados ao board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-search">Buscar usuário</Label>
              <Input
                id="user-search"
                placeholder="Nome ou e-mail..."
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {(() => {
                const memberIds = new Set(members.map((m) => m.id));
                const filtered = allUsers
                  .filter((u) => !memberIds.has(u.id))
                  .filter((u) => {
                    const term = searchTerm.trim().toLowerCase();
                    if (!term) return true;
                    const name = u.name.toLowerCase();
                    const email = (u.email ?? '').toLowerCase();
                    return name.includes(term) || email.includes(term);
                  });
                if (filtered.length === 0) {
                  return (
                    <div className="text-sm text-muted-foreground text-center py-6">
                      {searchTerm ? 'Nenhum usuário encontrado' : 'Todos os usuários já são membros'}
                    </div>
                  );
                }
                return filtered.map((u) => (
                  <Button
                    key={u.id}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto p-3"
                    onClick={async () => {
                      try {
                        const { error: insertErr } = await supabase
                          .from('board_members')
                          .insert({ board_id: board.id, user_id: u.id });
                        if (insertErr) throw insertErr;
                        toast({ title: 'Membro adicionado', description: `${u.name} agora faz parte do board.` });
                        setMembers((prev) => [...prev, { id: u.id, name: u.name, avatar: u.avatar }]);
                      } catch (err) {
                        console.error('Erro ao adicionar membro:', err);
                        toast({ title: 'Erro ao adicionar', description: getErrorMessage(err), variant: 'destructive' });
                      }
                    }}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={u.avatar || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(u.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{u.name}</span>
                      {u.email && (
                        <span className="text-xs text-muted-foreground">{u.email}</span>
                      )}
                    </div>
                  </Button>
                ));
              })()}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setInviteOpen(false)}>Fechar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}