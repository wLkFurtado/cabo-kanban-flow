import type { Board, Card, List, CustomField } from "../kanbanTypes";

// --- UTILIDADES GERAIS --- //

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now()
    .toString(36)
    .slice(-4)}`;
}

export function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed as T);
  return result;
}

// Cria um board vazio com listas padrão
export function createDefaultBoard(title: string): Board {
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

// Template board específico para solicitações de arte
export function createSolicitacaoArteBoard(): Board {
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
      options: [
        "Campanha de mídia (Feed, Stories, etc.)",
        "Design gráfico (cartazes, folders, banners, etc.)",
        "Outros",
      ],
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
    {
      id: "cf_medidas_pecas",
      name: "Medidas das peças solicitadas",
      type: "textarea",
      required: true,
      showOnCard: false,
      helpText:
        "Ex.: Digital: Google Forms, Banner Site / Gráfico: Lonas, Banners, Flyers, Cartões, Adesivos",
      order: 4,
    },
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