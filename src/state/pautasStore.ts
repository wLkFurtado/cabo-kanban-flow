import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Evento, 
  PautasState, 
  MetricasDashboard,
  criarEventoVazio
} from './pautasTypes';
import { addDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
// Removido: useAuthStore - usar useAuth para autenticação segura

interface PautasActions {
  // Eventos
  adicionarEvento: (evento: Omit<Evento, 'id'>) => void;
  atualizarEvento: (id: string, evento: Partial<Evento>) => void;
  removerEvento: (id: string) => void;
  duplicarEvento: (id: string) => void;
  obterEventosPorPeriodo: (inicio: Date, fim: Date) => Evento[];
  obterEventosDoUsuario: (userEmail: string) => Evento[];
  
  // Métricas
  calcularMetricas: () => void;
  obterMetricasSemana: (semana: Date) => MetricasDashboard;
  
  // Filtros e Configurações
  atualizarFiltros: (filtros: Partial<PautasState['filtros']>) => void;
  atualizarConfiguracoes: (config: Partial<PautasState['configuracoes']>) => void;
  
  // Utilitários
  limparDados: () => void;
  importarDados: (dados: Partial<PautasState>) => void;
  exportarDados: () => PautasState;
}

type PautasStore = PautasState & PautasActions;

const estadoInicial: PautasState = {
  eventos: [],
  metricas: {
    totalEventos: 0,
    eventosPorTipo: {},
    eventosPorStatus: {},
    horasTrabalhadasSemana: 0,
    produtividade: {
      semanaAtual: 0,
      semanaAnterior: 0,
      tendencia: 'estavel'
    }
  },
  filtros: {
    dataInicio: startOfWeek(new Date()),
    dataFim: endOfWeek(new Date()),
    tipos: [],
    status: []
  },
  configuracoes: {
    horaInicio: 8,
    horaFim: 20,
    intervaloSlots: 60,
    notificacoes: true,
    temaEscuro: false
  }
};

// Função para converter strings de data em objetos Date
const deserializeDates = (state: unknown): PautasState => {
  if (!state || typeof state !== 'object') return estadoInicial;

  const stateObj = state as Record<string, unknown>;

  // Normaliza eventos convertendo campos de data
  const eventos: Evento[] = Array.isArray(stateObj.eventos)
    ? stateObj.eventos.map((evento: unknown): Evento => {
        if (typeof evento !== 'object' || !evento) return evento as Evento;
        const eventoObj = evento as Record<string, unknown>;
        const dataInicioRaw = eventoObj.dataInicio as string | Date | undefined;
        const dataFimRaw = eventoObj.dataFim as string | Date | undefined;
        return {
          ...(eventoObj as unknown as Omit<Evento, 'dataInicio' | 'dataFim'>),
          dataInicio:
            typeof dataInicioRaw === 'string'
              ? new Date(dataInicioRaw)
              : dataInicioRaw instanceof Date
              ? dataInicioRaw
              : new Date(),
          dataFim:
            typeof dataFimRaw === 'string'
              ? new Date(dataFimRaw)
              : dataFimRaw instanceof Date
              ? dataFimRaw
              : new Date(),
        } as Evento;
      })
    : [];

  // Normaliza filtros sem usar any
  const rawFiltros = stateObj.filtros;
  let filtros: PautasState['filtros'] = {
    dataInicio: startOfWeek(new Date()),
    dataFim: endOfWeek(new Date()),
    tipos: [],
    status: [],
  };

  if (rawFiltros && typeof rawFiltros === 'object') {
    const rf = rawFiltros as {
      dataInicio?: string | Date;
      dataFim?: string | Date;
      tipos?: unknown;
      status?: unknown;
    };

    const di = rf.dataInicio;
    const df = rf.dataFim;
    filtros = {
      ...filtros,
      dataInicio:
        typeof di === 'string'
          ? new Date(di)
          : di instanceof Date
          ? di
          : filtros.dataInicio,
      dataFim:
        typeof df === 'string'
          ? new Date(df)
          : df instanceof Date
          ? df
          : filtros.dataFim,
      tipos: Array.isArray(rf.tipos)
        ? (rf.tipos as unknown[]).filter((t): t is string => typeof t === 'string')
        : [],
      status: Array.isArray(rf.status)
        ? (rf.status as unknown[]).filter((s): s is string => typeof s === 'string')
        : [],
    };
  }

  return {
    ...estadoInicial,
    ...stateObj,
    eventos,
    filtros,
  };
};

export const usePautasStore = create<PautasStore>()(persist(
    (set, get) => ({
      ...estadoInicial,
      
      // Eventos
      adicionarEvento: (evento) => {
        const novoEvento: Evento = {
          ...evento,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        };
        
        set((state) => ({
          eventos: [...state.eventos, novoEvento]
        }));
        
        get().calcularMetricas();
      },
      
      atualizarEvento: (id, eventoAtualizado) => {
        set((state) => ({
          eventos: state.eventos.map(evento => 
            evento.id === id ? { ...evento, ...eventoAtualizado } : evento
          )
        }));
        
        get().calcularMetricas();
      },
      
      removerEvento: (id) => {
        set((state) => ({
          eventos: state.eventos.filter(evento => evento.id !== id)
        }));
        
        get().calcularMetricas();
      },
      
      duplicarEvento: (id) => {
        const evento = get().eventos.find(e => e.id === id);
        if (evento) {
          const eventoDuplicado: Omit<Evento, 'id'> = {
            ...evento,
            titulo: `${evento.titulo} (Cópia)`,
            dataInicio: addDays(evento.dataInicio, 1),
            dataFim: addDays(evento.dataFim, 1)
          };
          delete (eventoDuplicado as Partial<Evento>).id;
          get().adicionarEvento(eventoDuplicado);
        }
      },
      
      obterEventosPorPeriodo: (inicio, fim) => {
        return get().eventos.filter(evento => 
          isWithinInterval(evento.dataInicio, { start: inicio, end: fim }) ||
          isWithinInterval(evento.dataFim, { start: inicio, end: fim })
        );
      },
      
      obterEventosDoUsuario: (userEmail) => {
        return get().eventos.filter(evento => {
          // Usuário é responsável pelo evento
          if (evento.responsavel === userEmail) return true;
          // Usuário está na lista de participantes
          if (evento.participantes.includes(userEmail)) return true;
          return false;
        });
      },
      

      
      // Métricas
      calcularMetricas: () => {
        const { eventos } = get();
        
        const eventosPorTipo = eventos.reduce((acc, evento) => {
          acc[evento.tipo] = (acc[evento.tipo] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const eventosPorStatus = eventos.reduce((acc, evento) => {
          acc[evento.status] = (acc[evento.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const metricas: MetricasDashboard = {
          totalEventos: eventos.length,
          eventosPorTipo,
          eventosPorStatus,
          horasTrabalhadasSemana: 0,
          produtividade: {
            semanaAtual: eventos.filter(e => e.status === 'concluido').length,
            semanaAnterior: 0, // Implementar cálculo histórico
            tendencia: 'estavel'
          }
        };
        
        set({ metricas });
      },
      
      obterMetricasSemana: (semana) => {
        const inicioSemana = startOfWeek(semana);
        const fimSemana = endOfWeek(semana);
        const eventosSemana = get().obterEventosPorPeriodo(inicioSemana, fimSemana);
        
        return {
          totalEventos: eventosSemana.length,
          eventosPorTipo: eventosSemana.reduce((acc, e) => {
            acc[e.tipo] = (acc[e.tipo] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          eventosPorStatus: eventosSemana.reduce((acc, e) => {
            acc[e.status] = (acc[e.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          horasTrabalhadasSemana: 0,
          produtividade: get().metricas.produtividade
        };
      },
      
      // Filtros e Configurações
      atualizarFiltros: (novosFiltros) => {
        set((state) => ({
          filtros: { ...state.filtros, ...novosFiltros }
        }));
      },
      
      atualizarConfiguracoes: (novasConfiguracoes) => {
        set((state) => ({
          configuracoes: { ...state.configuracoes, ...novasConfiguracoes }
        }));
      },
      
      // Utilitários
      limparDados: () => {
        set(estadoInicial);
      },
      
      importarDados: (dados) => {
        set((state) => ({ ...state, ...dados }));
        get().calcularMetricas();
      },
      
      exportarDados: () => {
        const { 
          adicionarEvento, atualizarEvento, removerEvento, duplicarEvento,
          obterEventosPorPeriodo,
          calcularMetricas, obterMetricasSemana, atualizarFiltros,
          atualizarConfiguracoes, limparDados, importarDados, exportarDados,
          ...dados
        } = get();
        
        return dados;
      }
    }),
    {
      name: 'pautas-storage',
      partialize: (state) => ({
        eventos: state.eventos,
        configuracoes: state.configuracoes,
        filtros: state.filtros
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const deserializedState = deserializeDates(state);
          Object.assign(state, deserializedState);
        }
      }
    }
  )
);