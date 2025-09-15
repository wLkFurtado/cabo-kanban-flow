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
import { useAuthStore, getInitials } from "@/state/authStore";
import { Member } from "@/state/kanbanTypes";
import { User, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MemberSelectProps {
  selectedMembers: Member[];
  onMembersChange: (members: Member[]) => void;
  className?: string;
}

export function MemberSelect({ selectedMembers, onMembersChange, className }: MemberSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { getAllUsers } = useAuthStore();
  
  const allUsers = getAllUsers();
  
  // Filter users based on search term and exclude already selected members
  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const notSelected = !selectedMembers.some(member => member.id === user.id);
    return matchesSearch && notSelected;
  });

  const addMember = (user: { id: string; name: string; avatarUrl?: string }) => {
    const newMember: Member = {
      id: user.id,
      name: user.name,
      avatar: user.avatarUrl,
    };
    onMembersChange([...selectedMembers, newMember]);
    setSearchTerm("");
  };

  const removeMember = (memberId: string) => {
    onMembersChange(selectedMembers.filter(member => member.id !== memberId));
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
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback className="text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
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