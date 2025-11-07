import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { EditableText } from "@/components/editable/EditableText";
import { Board } from "@/state/kanbanTypes";
import { useBoardsStore } from "@/state/boards/store";
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
      className="rounded-lg border bg-card hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
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
      
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div ref={titleRef} className="min-w-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              {board.icon && <span className="text-xl leading-none">{board.icon}</span>}
              <EditableText
                value={board.title}
                onSubmit={(v) => updateBoardTitle(board.id, v)}
                className="text-base font-semibold"
                placeholder="Sem título"
              />
            </div>
            {board.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{board.description}</p>
            )}
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
    </div>
  );
}
