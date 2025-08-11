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
  updateBoardTitle: (boardId: string, title: string) => void;
  updateBoard: (boardId: string, patch: Partial<Board>) => void;
  // Lists management
  addList: (boardId: string, title: string) => string;
  deleteList: (boardId: string, listId: string) => void;
  moveList: (boardId: string, fromIndex: number, toIndex: number) => void;
  updateListTitle: (boardId: string, listId: string, title: string) => void;
  // Cards management
  addCard: (boardId: string, listId: string, title: string) => string;
  updateCard: (boardId: string, cardId: string, patch: Partial<Card>) => void;
  deleteCard: (boardId: string, listId: string, cardId: string) => void;
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
      updateBoardTitle: (boardId: string, title: string) => {
        set((state) => {
          const board = state.boards[boardId];
          if (!board) return state;
          const updated: Board = { ...board, title };
          return { boards: { ...state.boards, [boardId]: updated } };
        });
      },
      updateBoard: (boardId: string, patch: Partial<Board>) => {
        set((state) => {
          const board = state.boards[boardId];
          if (!board) return state;
          const updated: Board = { ...board, ...patch };
          return { boards: { ...state.boards, [boardId]: updated } };
        });
      },
      addList: (boardId: string, title: string) => {
        const id = uid("l");
        set((state) => {
          const board = state.boards[boardId];
          if (!board) return state;
          const position = board.listsOrder.length;
          const newList: List = { id, title: title || "Nova lista", position };
          const updated: Board = {
            ...board,
            lists: { ...board.lists, [id]: newList },
            listsOrder: [...board.listsOrder, id],
            cardsByList: { ...board.cardsByList, [id]: [] },
          };
          return { boards: { ...state.boards, [boardId]: updated } };
        });
        return id;
      },
      deleteList: (boardId: string, listId: string) => {
        set((state) => {
          const board = state.boards[boardId];
          if (!board) return state;
          if (!board.lists[listId]) return state;
          const { [listId]: _removed, ...restLists } = board.lists;
          const newOrder = board.listsOrder.filter((id) => id !== listId);
          const reindexedLists: Record<string, List> = { ...restLists };
          newOrder.forEach((id, index) => {
            reindexedLists[id] = { ...reindexedLists[id], position: index };
          });
          const { [listId]: _removedCards, ...restCardsByList } = board.cardsByList;
          const updated: Board = {
            ...board,
            lists: reindexedLists,
            listsOrder: newOrder,
            cardsByList: restCardsByList,
          };
          return { boards: { ...state.boards, [boardId]: updated } };
        });
      },
      moveList: (boardId: string, fromIndex: number, toIndex: number) => {
        set((state) => {
          const board = state.boards[boardId];
          if (!board) return state;
          const newOrder = reorder(board.listsOrder, fromIndex, toIndex);
          const newLists: Record<string, List> = { ...board.lists };
          newOrder.forEach((id, index) => {
            newLists[id] = { ...newLists[id], position: index };
          });
          const updated: Board = {
            ...board,
            listsOrder: newOrder,
            lists: newLists,
          };
          return { boards: { ...state.boards, [boardId]: updated } };
        });
      },
      updateListTitle: (boardId: string, listId: string, title: string) => {
        set((state) => {
          const board = state.boards[boardId];
          if (!board) return state;
          const list = board.lists[listId];
          if (!list) return state;
          const updatedList: List = { ...list, title };
          const updated: Board = {
            ...board,
            lists: { ...board.lists, [listId]: updatedList },
          };
          return { boards: { ...state.boards, [boardId]: updated } };
        });
      },
      addCard: (boardId: string, listId: string, title: string) => {
        const id = uid("c");
        set((state) => {
          const board = state.boards[boardId];
          if (!board) return state;
          const listCards = Array.from(board.cardsByList[listId] || []);
          const newCard: Card = {
            id,
            listId,
            title,
            description: "",
            position: listCards.length,
            labels: [],
            members: [],
          };
          const updated: Board = {
            ...board,
            cardsByList: {
              ...board.cardsByList,
              [listId]: [...listCards, newCard],
            },
          };
          return { boards: { ...state.boards, [boardId]: updated } };
        });
        return id;
      },
      updateCard: (boardId: string, cardId: string, patch: Partial<Card>) => {
        set((state) => {
          const board = state.boards[boardId];
          if (!board) return state;
          let foundListId: string | null = null;
          let foundIndex = -1;
          for (const lid of Object.keys(board.cardsByList)) {
            const idx = (board.cardsByList[lid] || []).findIndex((c) => c.id === cardId);
            if (idx !== -1) {
              foundListId = lid;
              foundIndex = idx;
              break;
            }
          }
          if (!foundListId || foundIndex === -1) return state;
          const existing = board.cardsByList[foundListId][foundIndex];
          const { listId: _ignoreList, position: _ignorePos, ...rest } = patch as any;
          const updatedCard: Card = { ...existing, ...rest };
          const updatedList = board.cardsByList[foundListId].slice();
          updatedList[foundIndex] = updatedCard;
          const updated: Board = {
            ...board,
            cardsByList: {
              ...board.cardsByList,
              [foundListId]: updatedList,
            },
          };
          return { boards: { ...state.boards, [boardId]: updated } };
        });
      },
      deleteCard: (boardId: string, listId: string, cardId: string) => {
        set((state) => {
          const board = state.boards[boardId];
          if (!board) return state;
          const source = Array.from(board.cardsByList[listId] || []);
          const filtered = source.filter((c) => c.id !== cardId).map((c, i) => ({ ...c, position: i }));
          const updated: Board = {
            ...board,
            cardsByList: {
              ...board.cardsByList,
              [listId]: filtered,
            },
          };
          return { boards: { ...state.boards, [boardId]: updated } };
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
