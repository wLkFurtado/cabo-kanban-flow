import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type ViewMode = "month" | "week";

interface AgendaCalendarState {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const useAgendaCalendarStore = create<AgendaCalendarState>()(
  devtools((set) => ({
    selectedDate: undefined,
    setSelectedDate: (date) => set({ selectedDate: date }),
    viewMode: "month",
    setViewMode: (mode) => set({ viewMode: mode }),
  }))
);