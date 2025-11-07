import type { StateCreator } from "zustand";
import type { Board } from "../../kanbanTypes";
import { createDefaultBoard, createSolicitacaoArteBoard, uid } from "../helpers";
import type { BoardsStore } from "../types";

export interface BoardsMetaSlice {
  boards: Record<string, Board>;
  boardOrder: string[];
  initializeTemplateBoards: () => void;
  createBoard: (title: string) => string;
  deleteBoard: (boardId: string) => void;
  updateBoardTitle: (boardId: string, title: string) => void;
  updateBoard: (boardId: string, patch: Partial<Board>) => void;
}

export const createBoardsMetaSlice: StateCreator<
  BoardsStore,
  [["zustand/persist", unknown]],
  [],
  BoardsMetaSlice
> = (set, get) => ({
  boards: {},
  boardOrder: [],

  initializeTemplateBoards: () => {
    const TEMPLATE_ID = "board_template_solicitacao_arte";
    set((state) => {
      const templateBoard = createSolicitacaoArteBoard();
      return {
        boards: { ...state.boards, [TEMPLATE_ID]: templateBoard },
        boardOrder: [TEMPLATE_ID, ...state.boardOrder.filter((id) => id !== TEMPLATE_ID)],
      };
    });
  },

  createBoard: (title: string) => {
    const board = createDefaultBoard(title);
    set((state) => ({
      boards: { ...state.boards, [board.id]: board },
      boardOrder:
        state.boardOrder[0] === "board_template_solicitacao_arte"
          ? [state.boardOrder[0], board.id, ...state.boardOrder.slice(1).filter((id) => id !== board.id)]
          : [board.id, ...state.boardOrder.filter((id) => id !== board.id)],
    }));
    return board.id;
  },

  deleteBoard: (boardId: string) => {
    set((state) => {
      if (state.boards[boardId]?.isTemplate) return state;
      const { [boardId]: _removed, ...rest } = state.boards;
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
      if (board.isTemplate) return state;
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
});