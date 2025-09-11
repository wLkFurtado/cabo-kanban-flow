import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Board, Card, List, CustomField, Comment } from "./kanbanTypes";

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
    customFields: [],
  };
}

// Template board for "Solicitação de Arte" with predefined custom fields
function createSolicitacaoArteBoard(): Board {
  const TEMPLATE_ID = "board_template_solicitacao_arte";
  const now = new Date().toISOString();
  const listsOrder = ["briefing", "desenvolvimento", "revisao", "aprovado", "entregue"];
  const lists: Record<string, List> = {
    briefing: { id: "briefing", title: "Briefing", position: 0 },
    desenvolvimento: { id: "desenvolvimento", title: "Em Desenvolvimento", position: 1 },
    revisao: { id: "revisao", title: "Em Revisão", position: 2 },
    aprovado: { id: "aprovado", title: "Aprovado", position: 3 },
    entregue: { id: "entregue", title: "Entregue", position: 4 },
  };
  const cardsByList: Record<string, Card[]> = {
    briefing: [],
    desenvolvimento: [],
    revisao: [],
    aprovado: [],
    entregue: [],
  };

  const customFields: CustomField[] = [
    // Dados da Secretaria Solicitante e Tipo de Demanda
    {
      id: "cf_secretaria",
      name: "Nome da Secretaria",
      type: "text",
      required: true,
      showOnCard: true,
      helpText: "Nome da secretaria solicitante",
      order: 0,
    },
    {
      id: "cf_responsavel",
      name: "Responsável pela Pasta",
      type: "text",
      required: true,
      showOnCard: true,
      helpText: "Nome do responsável pela pasta",
      order: 1,
    },
    {
      id: "cf_tipo_demanda",
      name: "Tipo de Demanda",
      type: "select",
      required: true,
      showOnCard: true,
      options: ["Campanha de mídia (Feed, Stories, etc.)", "Design gráfico (cartazes, folders, banners, etc.)", "Outros"],
      helpText: "Selecione o tipo de demanda",
      order: 2,
    },
    {
      id: "cf_outros_especificar",
      name: "Outros (especificar)",
      type: "text",
      required: false,
      showOnCard: false,
      helpText: "Especifique caso tenha selecionado 'Outros' no tipo de demanda",
      order: 3,
    },
    // Medidas das peças solicitadas
    {
      id: "cf_medidas_pecas",
      name: "Medidas das peças solicitadas",
      type: "textarea",
      required: true,
      showOnCard: false,
      helpText: "Ex.: Digital: Google Forms, Banner Site / Gráfico: Lonas, Banners, Flyers, Cartões, Adesivos",
      order: 4,
    },
    // Cronograma
    {
      id: "cf_data_inicio",
      name: "Data de Início",
      type: "date",
      required: true,
      showOnCard: true,
      helpText: "Data de início do projeto",
      order: 5,
    },
    {
      id: "cf_data_entrega",
      name: "Data de Término/Entrega",
      type: "date",
      required: true,
      showOnCard: true,
      helpText: "Data limite para entrega",
      order: 6,
    },
    // Materiais Necessários e Observações
    {
      id: "cf_materiais",
      name: "Materiais Necessários",
      type: "textarea",
      required: false,
      showOnCard: false,
      helpText: "Anexar materiais como textos, imagens, logotipos e referências",
      order: 7,
    },
    {
      id: "cf_texto_revisado",
      name: "Texto já revisado pelo setor de Jornalismo",
      type: "checkbox",
      required: false,
      showOnCard: true,
      helpText: "Marque se o texto já foi revisado pelo setor de Jornalismo",
      order: 8,
    },
    {
      id: "cf_observacoes_adicionais",
      name: "Observações adicionais sobre os materiais",
      type: "textarea",
      required: false,
      showOnCard: false,
      helpText: "Informações adicionais sobre os materiais (caso necessário)",
      order: 9,
    },
  ];

  return {
    id: TEMPLATE_ID,
    title: "SOLICITAÇÃO DE ARTE",
    createdAt: now,
    listsOrder,
    lists,
    cardsByList,
    customFields,
    isTemplate: true,
    description: "Board template para solicitações de arte e design",
    icon: "🎨",
  };
}

interface BoardsState {
  boards: Record<string, Board>;
  boardOrder: string[]; // order of board ids (recent first)
  createBoard: (title: string) => string; // returns boardId
  deleteBoard: (boardId: string) => void;
  updateBoardTitle: (boardId: string, title: string) => void;
  updateBoard: (boardId: string, patch: Partial<Board>) => void;
  initializeTemplateBoards: () => void;
  // Custom fields management
  addCustomField: (boardId: string, field: Omit<CustomField, "id" | "order"> & Partial<Pick<CustomField, "order">>) => string;
  updateCustomField: (boardId: string, fieldId: string, patch: Partial<CustomField>) => void;
  deleteCustomField: (boardId: string, fieldId: string) => void;
  reorderCustomFields: (boardId: string, fromIndex: number, toIndex: number) => void;
  // Cards custom values
  setCardCustomValue: (boardId: string, cardId: string, fieldId: string, value: unknown) => void;
  // Comments management
  addComment: (boardId: string, cardId: string, author: string, content: string, type: "comment" | "activity") => string;
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
      initializeTemplateBoards: () => {
        const TEMPLATE_ID = "board_template_solicitacao_arte";
        console.log("Initializing template boards");
        set((state) => {
          console.log("Current boards:", Object.keys(state.boards));
          // Always create/update template board with latest fields
          console.log("Creating/updating template board");
          const templateBoard = createSolicitacaoArteBoard();
          console.log("Template board created/updated:", templateBoard);
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
          boardOrder: state.boardOrder[0] === "board_template_solicitacao_arte"
            ? [state.boardOrder[0], board.id, ...state.boardOrder.slice(1).filter((id) => id !== board.id)]
            : [board.id, ...state.boardOrder.filter((id) => id !== board.id)],
        }));
        return board.id;
      },
      deleteBoard: (boardId: string) => {
        set((state) => {
          // Prevent deletion of template board
          if (state.boards[boardId]?.isTemplate) {
            return state;
          }
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
          
          // Não permite editar o título do board de solicitação de arte
          if (boardId === "b_q1lk2c5be4" || board.isTemplate) {
            return state;
          }
          
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
      // Custom fields management
      addCustomField: (boardId, fieldInput) => {
        const id = uid("cf");
        set((state) => {
          const board = state.boards[boardId];
          if (!board) return state;
          // Prevent adding fields to template board
          if (board.isTemplate) return state;
          const fields = Array.from(board.customFields || []);
          const order = fieldInput.order ?? fields.length;
          const newField: CustomField = {
            id,
            name: fieldInput.name || "Novo campo",
            type: fieldInput.type || "text",
            required: fieldInput.required || false,
            options: fieldInput.options || (fieldInput.type?.includes("select") ? ["Opção 1"] : undefined),
            showOnCard: fieldInput.showOnCard || false,
            helpText: fieldInput.helpText,
            order,
            defaultValue: fieldInput.defaultValue,
          };
          const newFields = [...fields, newField].sort((a, b) => a.order - b.order).map((f, i) => ({ ...f, order: i }));
          const updated: Board = { ...board, customFields: newFields };
          return { boards: { ...state.boards, [boardId]: updated } };
        });
        return id;
      },
      updateCustomField: (boardId, fieldId, patch) => {
        set((state) => {
          const board = state.boards[boardId];
          if (!board) return state;
          // Prevent updating fields in template board
          if (board.isTemplate) return state;
          const fields = Array.from(board.customFields || []);
          const idx = fields.findIndex((f) => f.id === fieldId);
          if (idx === -1) return state;
          const updatedField: CustomField = { ...fields[idx], ...patch } as CustomField;
          fields[idx] = updatedField;
          const normalized = fields.sort((a, b) => a.order - b.order).map((f, i) => ({ ...f, order: i }));
          const updated: Board = { ...board, customFields: normalized };
          return { boards: { ...state.boards, [boardId]: updated } };
        });
      },
      deleteCustomField: (boardId, fieldId) => {
        set((state) => {
          const board = state.boards[boardId];
          if (!board) return state;
          // Prevent deleting fields from template board
          if (board.isTemplate) return state;
          const fields = (board.customFields || []).filter((f) => f.id !== fieldId).map((f, i) => ({ ...f, order: i }));
          // Clean values from all cards
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
          return { boards: { ...state.boards, [boardId]: updated } };
        });
      },
      reorderCustomFields: (boardId, fromIndex, toIndex) => {
        set((state) => {
          const board = state.boards[boardId];
          if (!board) return state;
          // Prevent reordering fields in template board
          if (board.isTemplate) return state;
          const fields = Array.from(board.customFields || []);
          if (!fields.length) return state;
          const moved = (function(){ const arr = fields.slice(); const [it] = arr.splice(fromIndex,1); arr.splice(toIndex,0,it); return arr; })();
          const normalized = moved.map((f, i) => ({ ...f, order: i }));
          const updated: Board = { ...board, customFields: normalized };
          return { boards: { ...state.boards, [boardId]: updated } };
        });
      },
      setCardCustomValue: (boardId, cardId, fieldId, value) => {
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
          const custom = { ...(existing.custom || {}) } as Record<string, unknown>;
          if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
            delete custom[fieldId];
          } else {
            custom[fieldId] = value;
          }
          const updatedCard: Card = { ...existing, custom };
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
      addComment: (boardId, cardId, author, content, type) => {
        const commentId = uid("comment");
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
          const newComment: Comment = {
            id: commentId,
            cardId,
            author,
            content,
            timestamp: new Date().toISOString(),
            type,
          };
          
          const updatedCard: Card = {
            ...existing,
            comments: [...(existing.comments || []), newComment],
          };
          
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
        return commentId;
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
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initializeTemplateBoards();
        }
      },
    }
  )
);
