import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EditableText } from "../editable/EditableText";
import { Board } from "../../state/kanbanTypes";
import { useBoardsStore } from "../../state/boards/store";
import { useBoards } from "../../hooks/useBoards";
import type { BoardsStore } from "../../state/boards/types";
import { BoardActions } from "./BoardActions";
import { supabase } from "../../integrations/supabase/client";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

interface BoardCardProps {
  board: Board;
}

export function BoardCard({ board }: BoardCardProps) {
  const navigate = useNavigate();
  const updateBoardTitle = useBoardsStore((s: BoardsStore) => s.updateBoardTitle);
  const titleRef = useRef<HTMLDivElement>(null);
  const [members, setMembers] = useState<Array<{ id: string; name: string; avatar: string | null }>>([]);
  const { updateBoard } = useBoards();
  const isOnline = useOnlineStatus();

  function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
    return (first + last).toUpperCase() || 'U';
  }

  useEffect(() => {
    let mounted = true;
    const fetchMembers = async () => {
      if (!isOnline) return; // evita chamadas quando offline
      try {
        // 1) Buscar membros do board
        const { data: bmData, error: bmError } = await supabase
          .from('board_members')
          .select('user_id, profiles:profiles(id, full_name, avatar_url)')
          .eq('board_id', board.id);
        if (bmError) throw bmError;
        const rows = (bmData || []) as Array<{ user_id: string; profiles: { full_name?: string | null; avatar_url?: string | null } | null }>;
        const mapped = rows.map((row) => ({
          id: row.user_id,
          name: row.profiles?.full_name ?? 'Usuário',
          avatar: row.profiles?.avatar_url ?? null,
        }));

        // 2) Incluir o dono do board (se não estiver em board_members)
        let ownerEntry: { id: string; name: string; avatar: string | null } | null = null;
        const { data: boardRow, error: boardErr } = await supabase
          .from('boards')
          .select('owner_id')
          .eq('id', board.id)
          .single();
        if (boardErr) throw boardErr;
        const ownerId = (boardRow as { owner_id?: string | null })?.owner_id;
        if (ownerId) {
          type OwnerProfile = { id: string; full_name?: string | null; avatar_url?: string | null };
          const { data: ownerProfileData, error: ownerErr } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', ownerId)
            .single();
          if (!ownerErr && ownerProfileData) {
            const owner = ownerProfileData as OwnerProfile;
            ownerEntry = {
              id: owner.id,
              name: owner.full_name ?? 'Usuário',
              avatar: owner.avatar_url ?? null,
            };
          }
        }

        const combined = [...mapped, ...(ownerEntry ? [ownerEntry] : [])]
          .filter((m, idx, arr) => arr.findIndex((x) => x.id === m.id) === idx);
        console.log('[DEBUG] BoardCard members combined count:', combined.length, combined);

        if (mounted) setMembers(combined);
      } catch (err) {
        console.warn('Falha ao buscar membros do board:', err);
      }
    };
    fetchMembers();
    return () => { mounted = false; };
  }, [board.id, isOnline]);

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
                onSubmit={(v: string) => updateBoard({ id: board.id, title: v })}
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
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <AnimatedTooltip
              items={members.map((m) => ({
                id: m.id,
                name: m.name,
                image: m.avatar ?? "/placeholder.svg",
              }))}
              className="flex flex-wrap gap-1"
              imageClassName="h-7 w-7"
              overlap={true}
              overlapLevel={2}
            />
          </div>
        )}
      </div>
    </div>
  );
}
