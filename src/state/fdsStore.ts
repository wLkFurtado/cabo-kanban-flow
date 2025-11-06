import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WeekendTeam = {
  chefe?: string;
  jornalistas: string[];
  rede?: string;
  fotografo?: string;
  filmmaker?: string;
  edicao?: string;
  designer?: string;
  tamoios: string[];
  notes?: string;
};

export interface FdsState {
  teamsByWeekend: Record<string, WeekendTeam>; // key: YYYY-MM-DD (sábado)
  setTeam: (weekendKey: string, team: WeekendTeam) => void;
  updateRole: <K extends keyof WeekendTeam>(weekendKey: string, role: K, value: WeekendTeam[K]) => void;
  getTeam: (weekendKey: string) => WeekendTeam;
}

const emptyTeam: WeekendTeam = {
  jornalistas: [],
  tamoios: [],
};

export const useFdsStore = create<FdsState>()(
  persist(
    (set, get) => ({
      teamsByWeekend: {},
      setTeam: (weekendKey, team) => {
        set((state) => ({
          teamsByWeekend: { ...state.teamsByWeekend, [weekendKey]: { ...emptyTeam, ...team } },
        }));
      },
      updateRole: (weekendKey, role, value) => {
        const current = get().teamsByWeekend[weekendKey] || emptyTeam;
        set((state) => ({
          teamsByWeekend: {
            ...state.teamsByWeekend,
            [weekendKey]: { ...current, [role]: value },
          },
        }));
      },
      getTeam: (weekendKey) => {
        return get().teamsByWeekend[weekendKey] || emptyTeam;
      },
    }),
    {
      name: "fds-storage",
    }
  )
);

export const weekendKeyFromDate = (date: Date) => {
  // Normaliza para o sábado do mesmo fim de semana
  const d = new Date(date);
  const day = d.getDay(); // 0=domingo, 6=sábado
  const saturday = new Date(d);
  if (day === 0) {
    // Se for domingo, volta 1 dia para o sábado correspondente
    saturday.setDate(d.getDate() - 1);
  } else if (day !== 6) {
    // Fallback: retorna para o sábado anterior
    const diffToPrevSaturday = day + 1; // ex.: segunda(1)->2 dias atrás
    saturday.setDate(d.getDate() - diffToPrevSaturday);
  }
  const y = saturday.getFullYear();
  const m = String(saturday.getMonth() + 1).padStart(2, "0");
  const dd = String(saturday.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};