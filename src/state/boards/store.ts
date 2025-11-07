import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { BoardsStore } from "./types";
import { createBoardsMetaSlice } from "./slices/boardsSlice";
import { createListsSlice } from "./slices/listsSlice";
import { createCardsSlice } from "./slices/cardsSlice";
import { createCustomFieldsSlice } from "./slices/customFieldsSlice";

export const useBoardsStore = create<BoardsStore>()(
  persist(
    (...a) => ({
      ...createBoardsMetaSlice(...a),
      ...createListsSlice(...a),
      ...createCardsSlice(...a),
      ...createCustomFieldsSlice(...a),
    }),
    {
      name: "ccf-boards", // mesmo nome de storage do store antigo para manter os dados
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => state, // podemos ajustar depois se quisermos persistir apenas partes
    }
  )
);