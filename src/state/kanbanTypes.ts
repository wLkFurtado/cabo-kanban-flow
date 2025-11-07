export type LabelColor = string;

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

export type CustomFieldType = "text" | "textarea" | "number" | "date" | "select" | "checkbox" | "multi-select";

export interface CustomField {
  id: string;
  name: string;
  type: CustomFieldType;
  required?: boolean;
  options?: string[]; // for select / multi-select
  showOnCard?: boolean; // show as badge on card front
  helpText?: string;
  order: number;
  defaultValue?: unknown;
}

export type CommentType = "comment" | "activity";

export interface Comment {
  id: string;
  cardId: string;
  author: string;
  content: string;
  timestamp: string; // ISO string
  type: CommentType;
  avatarUrl?: string;
}

export interface Card {
  id: string;
  list_id: string;
  title: string;
  description?: string;
  position: number;
  dueDate?: string; // ISO string
  labels: Label[];
  members: Member[];
  archived?: boolean;
  custom?: Record<string, unknown>;
  comments?: Comment[];
  coverImages?: string[]; // Array de imagens em base64
  coverColor?: LabelColor; // Cor da capa quando não houver imagem
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
  icon?: string; // Emoji ou ícone curto
  description?: string;
  color?: string; // Ex.: hsl(...) ou #hex
  customFields?: CustomField[];
  isTemplate?: boolean; // Indica se é um board template/fixo
  coverImageUrl?: string; // URL da imagem de capa do board
  coverColor?: string; // Cor da capa quando não houver imagem (hex, hsl, ou LabelColor)
}
