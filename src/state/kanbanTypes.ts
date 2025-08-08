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

export interface Board {
  id: string;
  title: string;
  createdAt: string; // ISO string
  listsOrder: string[];
  lists: Record<string, List>;
  cardsByList: Record<string, Card[]>;
}
