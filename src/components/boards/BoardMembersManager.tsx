import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { getInitials } from "@/lib/utils";
import { UserPlus, X, Crown, Loader2 } from "lucide-react";
import { useBoardMembers } from "../../hooks/useBoardMembers";
import { useProfiles } from "../../hooks/useProfiles";
import { useAuth } from "../../hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface BoardMembersManagerProps {
  boardId: string;
}

export function BoardMembersManager({ boardId }: BoardMembersManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  
  const { user } = useAuth();
  const { profiles } = useProfiles();
  const {
    members,
    boardOwner,
    isLoading,
    addMember,
    removeMember,
    isAddingMember,
    isRemovingMember,
  } = useBoardMembers(boardId);

  // Get list of user IDs who are already members
  const memberIds = members.map((m) => m.user_id);

  // Filter available users (not already members)
  const availableUsers = (profiles || []).filter((profile) => {
    const isAlreadyMember = memberIds.includes(profile.id);
    const matchesSearch = searchTerm
      ? (profile.full_name || profile.display_name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (profile.email || "").toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return !isAlreadyMember && matchesSearch;
  });

  const handleAddMember = (userId: string) => {
    addMember(userId);
    setSearchTerm("");
  };

  const handleRemoveMember = () => {
    if (memberToRemove) {
      removeMember(memberToRemove.id);
      setMemberToRemove(null);
    }
  };

  const isOwner = (userId: string) => userId === boardOwner;
  const canRemoveMember = (memberId: string) => {
    // Owner can remove anyone, members can only remove themselves
    return user?.id === boardOwner || user?.id === memberId;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Members Section */}
      <div>
        <Label className="text-base font-semibold">Membros do Board</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Pessoas que têm acesso a este board
        </p>
        
        {members.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-md">
            Nenhum membro adicionado ainda
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => {
              const profile = member.profile;
              const name = profile?.full_name || profile?.display_name || "Usuário";
              const email = profile?.email || "";
              const avatarUrl = profile?.avatar_url || undefined;
              const isBoardOwner = isOwner(member.user_id);

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="text-sm">
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{name}</p>
                        {isBoardOwner && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Crown className="h-3 w-3" />
                            Owner
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{email}</p>
                    </div>
                  </div>
                  
                  {canRemoveMember(member.user_id) && !isBoardOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMemberToRemove({ id: member.user_id, name })}
                      className="hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Member Section */}
      <div>
        <Label className="text-base font-semibold">Adicionar Membro</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Busque e adicione pessoas ao board
        </p>
        
        <div className="space-y-3">
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="max-h-60 overflow-y-auto space-y-1 border rounded-md p-2">
            {availableUsers.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                {searchTerm
                  ? "Nenhum usuário encontrado"
                  : "Todos os usuários já são membros deste board"}
              </div>
            ) : (
              availableUsers.map((profile) => {
                const name = profile.full_name || profile.display_name || "Usuário";
                const email = profile.email || "";
                const avatarUrl = profile.avatar_url || undefined;

                return (
                  <Button
                    key={profile.id}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto p-3"
                    onClick={() => handleAddMember(profile.id)}
                    disabled={isAddingMember}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="text-xs">
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <span className="text-sm font-medium truncate w-full">{name}</span>
                      <span className="text-xs text-muted-foreground truncate w-full">
                        {email}
                      </span>
                    </div>
                    <UserPlus className="h-4 w-4 flex-shrink-0" />
                  </Button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Remove Confirmation Dialog */}
      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro do board?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{memberToRemove?.name}</strong> deste
              board? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingMember}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isRemovingMember}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isRemovingMember ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Removendo...
                </>
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
