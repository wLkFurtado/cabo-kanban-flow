import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Board, Card, List } from "./kanbanTypes";

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now()
    .toString(36)
    .slice(-4)}`;
}

function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed as T);
  return result;
}

function createDefaultBoard(title: string): Board {
  const now = new Date().toISOString();
  const listsOrder = ["ideas", "doing", "review", "approved", "published"];
  const lists: Record<string, List> = {
    ideas: { id: "ideas", title: "Ideias", position: 0 },
    doing: { id: "doing", title: "Em Andamento", position: 1 },
    review: { id: "review", title: "Revisão", position: 2 },
    approved: { id: "approved", title: "Aprovado", position: 3 },
    published: { id: "published", title: "Publicado", position: 4 },
  };
  const cardsByList: Record<string, Card[]> = {
    ideas: [],
    doing: [],
    review: [],
    approved: [],
    published: [],
  };

  return {
    id: uid("b"),
    title: title || "Novo Board",
    createdAt: now,
    listsOrder,
    lists,
    cardsByList,
  };
}

interface BoardsState {
  boards: Record<string, Board>;
  boardOrder: string[]; // order of board ids (recent first)
  createBoard: (title: string) => string; // returns boardId
  deleteBoard: (boardId: string) => void;
  moveCard: (
    boardId: string,
    fromListId: string,
    toListId: string,
    fromIndex: number,
    toIndex: number
  ) => void;
}

export const useBoardsStore = create<BoardsState>()(
  persist(
    (set, get) => ({
      boards: {},
      boardOrder: [],
      createBoard: (title: string) => {
        const board = createDefaultBoard(title);
        set((state) => ({
          boards: { ...state.boards, [board.id]: board },
          boardOrder: [board.id, ...state.boardOrder.filter((id) => id !== board.id)],
        }));
        return board.id;
      },
      deleteBoard: (boardId: string) => {
        set((state) => {
          const { [boardId]: _, ...rest } = state.boards;
          return {
            boards: rest,
            boardOrder: state.boardOrder.filter((id) => id !== boardId),
          };
        });
      },
      moveCard: (boardId, fromListId, toListId, fromIndex, toIndex) => {
        set((state) => {
          const board = state.boards[boardId];
          if (!board) return state;

          const source = Array.from(board.cardsByList[fromListId] || []);
          const destination = Array.from(board.cardsByList[toListId] || []);

          if (fromListId === toListId) {
            const reordered = reorder(source, fromIndex, toIndex).map((c, i) => ({
              ...c,
              position: i,
            }));
            const updated: Board = {
              ...board,
              cardsByList: {
                ...board.cardsByList,
                [fromListId]: reordered,
              },
            };
            return { boards: { ...state.boards, [boardId]: updated } };
          }

          const [moved] = source.splice(fromIndex, 1);
          const movedCard: Card = { ...moved, listId: toListId };
          destination.splice(toIndex, 0, movedCard);

          const updated: Board = {
            ...board,
            cardsByList: {
              ...board.cardsByList,
              [fromListId]: source.map((c, i) => ({ ...c, position: i })),
              [toListId]: destination.map((c, i) => ({ ...c, position: i })),
            },
          };
          return { boards: { ...state.boards, [boardId]: updated } };
        });
      },
    }),
    {
      name: "ccf-boards",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ boards: state.boards, boardOrder: state.boardOrder }),
    }
  )
);
