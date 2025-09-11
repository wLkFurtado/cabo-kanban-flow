import { Star, Users, Share2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { EditableText } from "@/components/editable/EditableText";
import { BoardActions } from "@/components/boards/BoardActions";
import { Board } from "@/state/kanbanTypes";
import { useBoardsStore } from "@/state/boardsStore";
import { useRef } from "react";

interface BoardHeaderProps {
  board: Board;
  onDeleted: () => void;
}

export function BoardHeader({ board, onDeleted }: BoardHeaderProps) {
  const updateBoardTitle = useBoardsStore((s) => s.updateBoardTitle);
  const titleRef = useRef<HTMLHeadingElement>(null);
  
  // Calculate progress based on completed cards
  const totalCards = Object.values(board.cardsByList).flat().length;
  const completedCards = Object.values(board.cardsByList)
    .flat()
    .filter(card => card.dueDate && new Date(card.dueDate) < new Date()).length;
  const progress = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;

  // Mock team members for demonstration
  const teamMembers = [
    { id: '1', name: 'Ana Silva', avatar: '' },
    { id: '2', name: 'Carlos Santos', avatar: '' },
    { id: '3', name: 'Maria Oliveira', avatar: '' },
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-4 pb-6 border-b bg-gradient-to-r from-background to-muted/20">
      {/* First row: Title, favorite, members, actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {board.icon && (
            <span className="text-3xl leading-none">{board.icon}</span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 ref={titleRef} className="text-2xl font-bold tracking-tight">
                <EditableText 
                  value={board.title} 
                  onSubmit={(v) => updateBoardTitle(board.id, v)} 
                />
              </h1>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-warning">
                <Star size={16} />
              </Button>
            </div>
            {board.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {board.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Team members */}
          <div className="flex items-center gap-1">
            {teamMembers.slice(0, 3).map((member, index) => (
              <Avatar key={member.id} className="h-8 w-8 border-2 border-background" style={{ marginLeft: index > 0 ? '-8px' : '0' }}>
                <AvatarImage src={member.avatar} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
            ))}
            <Button variant="outline" size="sm" className="h-8 ml-2">
              <Users size={14} className="mr-1" />
              Convidar
            </Button>
          </div>

          {/* Actions */}
          <Button variant="outline" size="sm" className="h-8">
            <Share2 size={14} className="mr-1" />
            Compartilhar
          </Button>
          
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
        </div>
      </div>

      {/* Second row: Progress bar and task counter */}
        <div className="flex-1 max-w-md">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progresso do Board</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">{totalCards}</span> tarefas
        </div>
    </div>
  );
}