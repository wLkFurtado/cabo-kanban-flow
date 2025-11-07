import type { BoardsMetaSlice } from "./slices/boardsSlice";
import type { ListsSlice } from "./slices/listsSlice";
import type { CardsSlice } from "./slices/cardsSlice";
import type { CustomFieldsSlice } from "./slices/customFieldsSlice";

// Agregação de todos os slices que compõem o store de boards.
// Quando novos slices forem criados, basta adicioná-los aqui.

export type BoardsStore = BoardsMetaSlice & ListsSlice & CardsSlice & CustomFieldsSlice;