import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Event, EventsState } from './eventTypes';

export const useEventsStore = create<EventsState>()(
  persist(
    (set, get) => ({
      events: [],
      
      addEvent: (eventData) => {
        const newEvent: Event = {
          ...eventData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          events: [...state.events, newEvent],
        }));
      },
      
      updateEvent: (id, eventData) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? { ...event, ...eventData } : event
          ),
        }));
      },
      
      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.filter((event) => event.id !== id),
        }));
      },
      
      getEventsByDate: (date) => {
        return get().events.filter((event) => event.date === date);
      },
    }),
    {
      name: 'events-storage',
    }
  )
);