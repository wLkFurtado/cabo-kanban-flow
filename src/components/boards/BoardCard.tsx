import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { EditableText } from "@/components/editable/EditableText";
import { Board } from "@/state/kanbanTypes";
import { useBoardsStore } from "@/state/boardsStore";
import { BoardActions } from "@/components/boards/BoardActions";

interface BoardCardProps {
  board: Board;
}

export function BoardCard({ board }: BoardCardProps) {
  const navigate = useNavigate();
  const updateBoardTitle = useBoardsStore((s) => s.updateBoardTitle);
  const titleRef = useRef<HTMLDivElement>(null);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/board/${board.id}`)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate(`/board/${board.id}`)}
      className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow cursor-pointer"
      aria-label={`Abrir board ${board.title}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div ref={titleRef} className="min-w-0" onClick={(e) => e.stopPropagation()}>
          <EditableText
            value={board.title}
            onSubmit={(v) => updateBoardTitle(board.id, v)}
            className="text-base font-semibold"
            placeholder="Sem título"
          />
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
      <p className="text-xs text-muted-foreground mt-1">
        {new Date(board.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}
