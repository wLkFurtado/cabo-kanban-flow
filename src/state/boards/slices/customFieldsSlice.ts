import type { StateCreator } from "zustand";
import type { Board, Card, CustomField } from "../../kanbanTypes";
import { uid } from "../helpers";
import type { BoardsStore } from "../types";

export interface CustomFieldsSlice {
  addCustomField: (
    boardId: string,
    field: Omit<CustomField, "id" | "order"> & Partial<Pick<CustomField, "order">>
  ) => string;
  updateCustomField: (boardId: string, fieldId: string, patch: Partial<CustomField>) => void;
  deleteCustomField: (boardId: string, fieldId: string) => void;
  reorderCustomFields: (boardId: string, fromIndex: number, toIndex: number) => void;
  setCardCustomValue: (
    boardId: string,
    cardId: string,
    fieldId: string,
    value: unknown
  ) => void;
}

function findCard(board: Board, cardId: string) {
  for (const lid of Object.keys(board.cardsByList)) {
    const idx = (board.cardsByList[lid] || []).findIndex((c) => c.id === cardId);
    if (idx !== -1) return { listId: lid, index: idx };
  }
  return null;
}

export const createCustomFieldsSlice: StateCreator<
  BoardsStore,
  [["zustand/persist", unknown]],
  [],
  CustomFieldsSlice
> = (set, get) => ({
  addCustomField: (boardId, fieldInput) => {
    const id = uid("cf");
    set((state) => {
      const board = state.boards[boardId];
      if (!board) return state;
      if (board.isTemplate) return state; // prevent on template
      const fields = Array.from(board.customFields || []);
      const order = fieldInput.order ?? fields.length;
      const newField: CustomField = {
        id,
        name: fieldInput.name || "Novo campo",
        type: fieldInput.type || "text",
        required: fieldInput.required || false,
        options:
          fieldInput.options || (fieldInput.type?.includes("select") ? ["Opção 1"] : undefined),
        showOnCard: fieldInput.showOnCard || false,
        helpText: fieldInput.helpText,
        order,
        defaultValue: fieldInput.defaultValue,
      } as CustomField;
      const newFields = [...fields, newField]
        .sort((a, b) => a.order - b.order)
        .map((f, i) => ({ ...f, order: i }));
      const updated: Board = { ...board, customFields: newFields };
      return { boards: { ...state.boards, [boardId]: updated } } as BoardsStore;
    });
    return id;
  },

  updateCustomField: (boardId, fieldId, patch) => {
    set((state) => {
      const board = state.boards[boardId];
      if (!board) return state;
      if (board.isTemplate) return state;
      const fields = Array.from(board.customFields || []);
      const idx = fields.findIndex((f) => f.id === fieldId);
      if (idx === -1) return state;
      fields[idx] = { ...fields[idx], ...patch } as CustomField;
      const normalized = fields
        .sort((a, b) => a.order - b.order)
        .map((f, i) => ({ ...f, order: i }));
      const updated: Board = { ...board, customFields: normalized };
      return { boards: { ...state.boards, [boardId]: updated } } as BoardsStore;
    });
  },

  deleteCustomField: (boardId, fieldId) => {
    set((state) => {
      const board = state.boards[boardId];
      if (!board) return state;
      if (board.isTemplate) return state;
      const fields = (board.customFields || [])
        .filter((f) => f.id !== fieldId)
        .map((f, i) => ({ ...f, order: i }));
      const newCardsByList: Board["cardsByList"] = Object.fromEntries(
        Object.entries(board.cardsByList).map(([lid, cards]) => [
          lid,
          cards.map((c) => {
            if (!c.custom) return c;
            const { [fieldId]: _removed, ...rest } = c.custom as Record<string, unknown>;
            return { ...c, custom: rest } as Card;
          }),
        ])
      );
      const updated: Board = { ...board, customFields: fields, cardsByList: newCardsByList };
      return { boards: { ...state.boards, [boardId]: updated } } as BoardsStore;
    });
  },

  reorderCustomFields: (boardId, fromIndex, toIndex) => {
    set((state) => {
      const board = state.boards[boardId];
      if (!board) return state;
      if (board.isTemplate) return state;
      const fields = Array.from(board.customFields || []);
      if (!fields.length) return state;
      const arr = fields.slice();
      const [it] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, it);
      const normalized = arr.map((f, i) => ({ ...f, order: i }));
      const updated: Board = { ...board, customFields: normalized };
      return { boards: { ...state.boards, [boardId]: updated } } as BoardsStore;
    });
  },

  setCardCustomValue: (boardId, cardId, fieldId, value) => {
    set((state) => {
      const board = state.boards[boardId];
      if (!board) return state;
      const located = findCard(board, cardId);
      if (!located) return state;
      const { listId, index } = located;
      const existing = board.cardsByList[listId][index];
      const custom = { ...(existing.custom || {}) } as Record<string, unknown>;
      if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
        delete custom[fieldId];
      } else {
        custom[fieldId] = value;
      }
      const updatedCard: Card = { ...existing, custom };
      const updatedList = board.cardsByList[listId].slice();
      updatedList[index] = updatedCard;
      const updated: Board = {
        ...board,
        cardsByList: { ...board.cardsByList, [listId]: updatedList },
      };
      return { boards: { ...state.boards, [boardId]: updated } } as BoardsStore;
    });
  },
});