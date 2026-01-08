export interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  dataInicio: Date;
  dataFim: Date;
  tipo: 'reuniao' | 'tarefa' | 'escala' | 'evento';
  prioridade: 'alta' | 'media' | 'baixa';
  status: 'agendado' | 'em_andamento' | 'concluido' | 'cancelado';
  responsavel: string; // Responsável pelo evento
  participantes: string[]; // Participantes do evento
  local?: string;
  observacoes?: string;
  filmmaker?: string; // identificador do filmmaker (ex: email)
  fotografo?: string; // identificador do fotógrafo (ex: email)
  jornalista?: string; // identificador do jornalista (ex: email)
  rede?: string; // identificador do responsável de redes (ex: email)
  recorrencia: 'nenhuma' | 'diaria' | 'semanal' | 'mensal';
  lembrete: number; // minutos antes
  tags: string[];
  anexos: string[];
  cor?: string; // Cor do evento
}

// Tipos auxiliares para TypeScript
export type TipoEvento = Evento['tipo'];
export type PrioridadeEvento = Evento['prioridade'];
export type StatusEvento = Evento['status'];
export type RecorrenciaEvento = Evento['recorrencia'];



export interface MetricasDashboard {
  totalEventos: number;
  eventosPorTipo: Record<string, number>;
  eventosPorStatus: Record<string, number>;
  horasTrabalhadasSemana: number;

  produtividade: {
    semanaAtual: number;
    semanaAnterior: number;
    tendencia: 'subindo' | 'descendo' | 'estavel';
  };
}

export interface PautasState {
  eventos: Evento[];

  metricas: MetricasDashboard;
  filtros: {
    dataInicio: Date;
    dataFim: Date;
    tipos: string[];
    status: string[];

  };
  configuracoes: {
    horaInicio: number;
    horaFim: number;
    intervaloSlots: number;
    notificacoes: boolean;
    temaEscuro: boolean;
  };
}

// Tipos para componentes
export interface EventCardProps {
  evento: Evento;
  variant?: 'compact' | 'detailed' | 'timeline';
  showActions?: boolean;
  onClick?: () => void;
}



export interface WeeklyAgendaProps {
  semanaInicio: Date;
  onSemanaChange: (data: Date) => void;
}

// Constantes
export const TIPOS_EVENTO = [
  { value: 'reuniao', label: 'Reunião', color: 'blue' },
  { value: 'tarefa', label: 'Tarefa', color: 'purple' },
  { value: 'escala', label: 'Escala', color: 'green' },
  { value: 'evento', label: 'Evento', color: 'orange' }
] as const;

export const PRIORIDADES = [
  { value: 'alta', label: 'Alta', color: 'red' },
  { value: 'media', label: 'Média', color: 'yellow' },
  { value: 'baixa', label: 'Baixa', color: 'green' }
] as const;

export const STATUS_EVENTO = [
  { value: 'agendado', label: 'Agendado', color: 'gray' },
  { value: 'em_andamento', label: 'Em Andamento', color: 'blue' },
  { value: 'concluido', label: 'Concluído', color: 'green' },
  { value: 'cancelado', label: 'Cancelado', color: 'red' }
] as const;

// Funções utilitárias
export const criarEventoVazio = (): Omit<Evento, 'id'> => ({
  titulo: '',
  descricao: '',
  dataInicio: new Date(),
  dataFim: new Date(),
  tipo: 'reuniao',
  prioridade: 'media',
  status: 'agendado',
  responsavel: '',
  participantes: [],
  local: '',
  observacoes: '',
  filmmaker: '',
  fotografo: '',
  jornalista: '',
  rede: '',
  recorrencia: 'nenhuma',
  lembrete: 15,
  tags: [],
  anexos: [],
  cor: '#3b82f6'
});