import { create } from "zustand";

export type LabelColor = "green" | "yellow" | "orange" | "red" | "purple" | "blue";

export interface Label {
  id: string;
  name: string;
  color: LabelColor;
}

export interface Member {
  id: string;
  name: string;
  avatar?: string;
}

export interface Card {
  id: string;
  listId: string;
  title: string;
  description?: string;
  position: number;
  dueDate?: string; // ISO string
  labels: Label[];
  members: Member[];
  archived?: boolean;
}

export interface List {
  id: string;
  title: string;
  position: number;
  archived?: boolean;
}

interface KanbanState {
  listsOrder: string[];
  lists: Record<string, List>;
  cardsByList: Record<string, Card[]>;
  moveCard: (
    fromListId: string,
    toListId: string,
    fromIndex: number,
    toIndex: number
  ) => void;
}

function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed as T);
  return result;
}

export const useKanbanStore = create<KanbanState>()((set) => ({
  listsOrder: ["ideas", "doing", "review", "approved", "published"],
  lists: {
    ideas: { id: "ideas", title: "Ideias", position: 0 },
    doing: { id: "doing", title: "Em Andamento", position: 1 },
    review: { id: "review", title: "Revisão", position: 2 },
    approved: { id: "approved", title: "Aprovado", position: 3 },
    published: { id: "published", title: "Publicado", position: 4 },
  },
  cardsByList: {
    ideas: [
      {
        id: "c1",
        listId: "ideas",
        title: "Briefing campanha Verão",
        description: "Coletar requisitos com secretaria de turismo",
        position: 0,
        labels: [
          { id: "l1", name: "Alto", color: "red" },
          { id: "l2", name: "Digital", color: "blue" },
        ],
        members: [
          { id: "u1", name: "Ana" },
          { id: "u2", name: "Bruno" },
        ],
      },
      {
        id: "c2",
        listId: "ideas",
        title: "Ideias para outdoor",
        position: 1,
        labels: [{ id: "l3", name: "Imagem", color: "purple" }],
        members: [{ id: "u3", name: "Carla" }],
      },
    ],
    doing: [
      {
        id: "c3",
        listId: "doing",
        title: "Roteiro de vídeo institucional",
        position: 0,
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
        labels: [
          { id: "l4", name: "Vídeo", color: "orange" },
          { id: "l5", name: "Médio", color: "yellow" },
        ],
        members: [{ id: "u4", name: "Diego" }],
      },
    ],
    review: [],
    approved: [],
    published: [],
  },
  moveCard: (fromListId, toListId, fromIndex, toIndex) =>
    set((state) => {
      const source = Array.from(state.cardsByList[fromListId] || []);
      const destination = Array.from(state.cardsByList[toListId] || []);

      if (fromListId === toListId) {
        const reordered = reorder(source, fromIndex, toIndex).map((c, i) => ({
          ...c,
          position: i,
        }));
        return {
          cardsByList: {
            ...state.cardsByList,
            [fromListId]: reordered,
          },
        };
      }

      const [moved] = source.splice(fromIndex, 1);
      const movedCard: Card = { ...moved, listId: toListId };
      destination.splice(toIndex, 0, movedCard);

      return {
        cardsByList: {
          ...state.cardsByList,
          [fromListId]: source.map((c, i) => ({ ...c, position: i })),
          [toListId]: destination.map((c, i) => ({ ...c, position: i })),
        },
      };
    }),
}));
