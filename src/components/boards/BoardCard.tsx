import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EditableText } from "../editable/EditableText";
import { Board } from "../../state/kanbanTypes";
import { useBoardsStore } from "../../state/boards/store";
import type { BoardsStore } from "../../state/boards/types";
import { BoardActions } from "./BoardActions";
import { supabase } from "../../integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { AnimatedTooltip } from "../ui/animated-tooltip";

interface BoardCardProps {
  board: Board;
}

export function BoardCard({ board }: BoardCardProps) {
  const navigate = useNavigate();
  const updateBoardTitle = useBoardsStore((s: BoardsStore) => s.updateBoardTitle);
  const titleRef = useRef<HTMLDivElement>(null);
  const [members, setMembers] = useState<Array<{ id: string; name: string; avatar: string | null }>>([]);

  useEffect(() => {
    let mounted = true;
    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('board_members')
          .select('user_id, profiles:profiles(id, full_name, avatar_url)')
          .eq('board_id', board.id);
        if (error) throw error;
        const rows = (data || []) as Array<{ user_id: string; profiles: { full_name?: string | null; avatar_url?: string | null } | null }>;
        const mapped = rows.map((row) => ({
          id: row.user_id,
          name: row.profiles?.full_name ?? 'Usuário',
          avatar: row.profiles?.avatar_url ?? null,
        }));
        if (mounted) setMembers(mapped);
      } catch (err) {
        console.warn('Falha ao buscar membros do board:', err);
      }
    };
    fetchMembers();
    return () => { mounted = false; };
  }, [board.id]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/board/${board.id}`)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate(`/board/${board.id}`)}
      className="rounded-lg border bg-card hover:bg-muted/40 hover:shadow-md transition-colors cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={`Abrir board ${board.title}`}
    >
      {/* Cover Section */}
      {(board.coverImageUrl || board.coverColor) && (
        <div className="relative h-24 w-full">
          {board.coverImageUrl ? (
            <img
              src={board.coverImageUrl}
              alt={`Capa do board ${board.title}`}
              className="w-full h-full object-cover"
            />
          ) : board.coverColor ? (
            <div
              className="w-full h-full"
              style={{ backgroundColor: board.coverColor }}
            />
          ) : null}
        </div>
      )}
      
      <div className="p-3 md:p-4">
        <div className="flex items-start justify-between gap-2">
          <div ref={titleRef} className="min-w-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <EditableText
                value={board.title}
                onSubmit={(v: string) => updateBoardTitle(board.id, v)}
                className="text-xl md:text-2xl font-semibold tracking-tight leading-tight"
                placeholder="Sem título"
              />
            </div>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <BoardActions
              boardId={board.id}
              onRename={() => {
                const btn = titleRef.current?.querySelector(
                  'button[aria-label="Editar texto"]'
                ) as HTMLButtonElement | null;
                btn?.click();
              }}
            />
          </div>
        </div>
        {members.length > 0 && (
          <div className="mt-3">
            <AnimatedTooltip
              className="flex -space-x-2"
              imageClassName="h-7 w-7 border bg-muted"
              items={members.slice(0, 5).map((m, idx) => ({
                id: idx,
                name: m.name,
                designation: "Membro",
                image: m.avatar ?? "/placeholder.svg",
              }))}
            />
            {members.length > 5 && (
              <div className="ml-2 text-xs text-muted-foreground inline-block align-middle">+{members.length - 5}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
