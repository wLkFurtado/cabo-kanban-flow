import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Evento, 
  PautasState, 
  MetricasDashboard,
  criarEventoVazio
} from './pautasTypes';
import { addDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { useAuthStore } from './authStore';

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
const deserializeDates = (state: any): PautasState => {
  if (!state) return estadoInicial;
  
  return {
    ...state,
    eventos: state.eventos?.map((evento: any) => ({
      ...evento,
      dataInicio: typeof evento.dataInicio === 'string' ? new Date(evento.dataInicio) : evento.dataInicio,
      dataFim: typeof evento.dataFim === 'string' ? new Date(evento.dataFim) : evento.dataFim
    })) || [],
    filtros: {
      ...state.filtros,
      dataInicio: typeof state.filtros?.dataInicio === 'string' ? new Date(state.filtros.dataInicio) : state.filtros?.dataInicio || startOfWeek(new Date()),
      dataFim: typeof state.filtros?.dataFim === 'string' ? new Date(state.filtros.dataFim) : state.filtros?.dataFim || endOfWeek(new Date())
    }
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
          const eventoDuplicado = {
            ...evento,
            titulo: `${evento.titulo} (Cópia)`,
            dataInicio: addDays(evento.dataInicio, 1),
            dataFim: addDays(evento.dataFim, 1)
          };
          delete (eventoDuplicado as any).id;
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