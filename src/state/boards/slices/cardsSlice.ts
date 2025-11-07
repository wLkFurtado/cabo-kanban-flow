import type { StateCreator } from "zustand";
import type { Board, Card, Comment } from "../../kanbanTypes";
import { uid, reorder } from "../helpers";
import type { BoardsStore } from "../types";

export interface CardsSlice {
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
   addComment: (
     boardId: string,
     cardId: string,
     author: string,
     content: string,
     type: Comment["type"]
   ) => string;
   addActivity: (
     boardId: string,
     cardId: string,
     author: string,
     activityType: string,
     description: string
   ) => string;
 }

function findCard(board: Board, cardId: string) {
  for (const lid of Object.keys(board.cardsByList)) {
    const idx = (board.cardsByList[lid] || []).findIndex((c) => c.id === cardId);
    if (idx !== -1) return { listId: lid, index: idx };
  }
  return null;
}

export const createCardsSlice: StateCreator<
  BoardsStore,
  [["zustand/persist", unknown]],
  [],
  CardsSlice
> = (set, get) => ({
  addCard: (boardId, listId, title) => {
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
        comments: [
          {
            id: uid("activity"),
            cardId: id,
            author: "Sistema",
            content: "card_created:criou este cartão",
            timestamp: new Date().toISOString(),
            type: "activity",
          },
        ],
      };
      const updated: Board = {
        ...board,
        cardsByList: { ...board.cardsByList, [listId]: [...listCards, newCard] },
      };
      return { boards: { ...state.boards, [boardId]: updated } } as BoardsStore;
    });
    return id;
  },

  updateCard: (boardId, cardId, patch) => {
    set((state) => {
      const board = state.boards[boardId];
      if (!board) return state;
      const located = findCard(board, cardId);
      if (!located) return state;
      const { listId, index } = located;
      const existing = board.cardsByList[listId][index];
      const { listId: _ignoreList, position: _ignorePos, ...rest } = patch as Partial<Card>;
      const updatedCard: Card = { ...existing, ...rest };
      const updatedList = board.cardsByList[listId].slice();
      updatedList[index] = updatedCard;
      const updated: Board = {
        ...board,
        cardsByList: { ...board.cardsByList, [listId]: updatedList },
      };
      return { boards: { ...state.boards, [boardId]: updated } } as BoardsStore;
    });
  },

  deleteCard: (boardId, listId, cardId) => {
    set((state) => {
      const board = state.boards[boardId];
      if (!board) return state;
      const source = Array.from(board.cardsByList[listId] || []);
      const filtered = source.filter((c) => c.id !== cardId).map((c, i) => ({ ...c, position: i }));
      const updated: Board = {
        ...board,
        cardsByList: { ...board.cardsByList, [listId]: filtered },
      };
      return { boards: { ...state.boards, [boardId]: updated } } as BoardsStore;
    });
  },

  moveCard: (boardId, fromListId, toListId, fromIndex, toIndex) => {
    set((state) => {
      const board = state.boards[boardId];
      if (!board) return state;
      const source = Array.from(board.cardsByList[fromListId] || []);
      const destination = Array.from(board.cardsByList[toListId] || []);
      if (fromListId === toListId) {
        const reordered = reorder(source, fromIndex, toIndex).map((c, i) => ({ ...c, position: i }));
        const updated: Board = {
          ...board,
          cardsByList: { ...board.cardsByList, [fromListId]: reordered },
        };
        return { boards: { ...state.boards, [boardId]: updated } } as BoardsStore;
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
      return { boards: { ...state.boards, [boardId]: updated } } as BoardsStore;
    });
  },

  addComment: (boardId, cardId, author, content, type) => {
    const commentId = uid("comment");
    set((state) => {
      const board = state.boards[boardId];
      if (!board) return state;
      const located = findCard(board, cardId);
      if (!located) return state;
      const { listId, index } = located;
      const existing = board.cardsByList[listId][index];
      const newComment: Comment = {
        id: commentId,
        cardId,
        author,
        content,
        timestamp: new Date().toISOString(),
        type,
      };
      const updatedCard: Card = { ...existing, comments: [...(existing.comments || []), newComment] };
      const updatedList = board.cardsByList[listId].slice();
      updatedList[index] = updatedCard;
      const updated: Board = {
        ...board,
        cardsByList: { ...board.cardsByList, [listId]: updatedList },
      };
      return { boards: { ...state.boards, [boardId]: updated } } as BoardsStore;
    });
    return commentId;
  },

  addActivity: (boardId, cardId, author, activityType, description) => {
    const activityId = uid("activity");
    set((state) => {
      const board = state.boards[boardId];
      if (!board) return state;
      const located = findCard(board, cardId);
      if (!located) return state;
      const { listId, index } = located;
      const existing = board.cardsByList[listId][index];
      const activity: Comment = {
        id: activityId,
        cardId,
        author,
        content: `${activityType}:${description}`,
        timestamp: new Date().toISOString(),
        type: "activity",
      };
      const updatedCard: Card = { ...existing, comments: [...(existing.comments || []), activity] };
      const updatedList = board.cardsByList[listId].slice();
      updatedList[index] = updatedCard;
      const updated: Board = {
        ...board,
        cardsByList: { ...board.cardsByList, [listId]: updatedList },
      };
      return { boards: { ...state.boards, [boardId]: updated } } as BoardsStore;
    });
    return activityId;
  },
});