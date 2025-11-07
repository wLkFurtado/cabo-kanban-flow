import type { StateCreator } from "zustand";
import type { Board, List } from "../../kanbanTypes";
import { uid, reorder } from "../helpers";
import type { BoardsStore } from "../types";

export interface ListsSlice {
  addList: (boardId: string, title: string) => string;
  deleteList: (boardId: string, listId: string) => void;
  moveList: (boardId: string, fromIndex: number, toIndex: number) => void;
  updateListTitle: (boardId: string, listId: string, title: string) => void;
}

export const createListsSlice: StateCreator<
  BoardsStore,
  [["zustand/persist", unknown]],
  [],
  ListsSlice
> = (set, get) => ({
  addList: (boardId, title) => {
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
      return { boards: { ...state.boards, [boardId]: updated } } as BoardsStore;
    });
    return id;
  },

  deleteList: (boardId, listId) => {
    set((state) => {
      const board = state.boards[boardId];
      if (!board) return state;
      if (!board.lists[listId]) return state;
      const { [listId]: _removed, ...restLists } = board.lists;
      const newOrder = board.listsOrder.filter((id) => id !== listId);
      const reindexed: Record<string, List> = { ...restLists };
      newOrder.forEach((id, idx) => {
        reindexed[id] = { ...reindexed[id], position: idx };
      });
      const { [listId]: _removedCards, ...restCards } = board.cardsByList;
      const updated: Board = {
        ...board,
        lists: reindexed,
        listsOrder: newOrder,
        cardsByList: restCards,
      };
      return { boards: { ...state.boards, [boardId]: updated } } as BoardsStore;
    });
  },

  moveList: (boardId, fromIndex, toIndex) => {
    set((state) => {
      const board = state.boards[boardId];
      if (!board) return state;
      const newOrder = reorder(board.listsOrder, fromIndex, toIndex);
      const newLists: Record<string, List> = { ...board.lists };
      newOrder.forEach((id, idx) => {
        newLists[id] = { ...newLists[id], position: idx };
      });
      const updated: Board = { ...board, listsOrder: newOrder, lists: newLists };
      return { boards: { ...state.boards, [boardId]: updated } } as BoardsStore;
    });
  },

  updateListTitle: (boardId, listId, title) => {
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
      return { boards: { ...state.boards, [boardId]: updated } } as BoardsStore;
    });
  },
});