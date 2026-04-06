import { create } from 'zustand';
import type { Event, CreateEventRequest, UpdateEventRequest } from '@repo/types';
import { eventsApi } from '../services/api';
import { cancelLocalAlarm } from '../utils/alarmManager';

interface EventsState {
  events: Event[];
  isLoading: boolean;
  error: string | null;

  fetchEvents: () => Promise<void>;
  createEvent: (data: CreateEventRequest) => Promise<Event>;
  updateEvent: (id: string, data: UpdateEventRequest) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  reset: () => void;
}

export const useEventsStore = create<EventsState>((set) => ({
  events: [],
  isLoading: false,
  error: null,

  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const events = await eventsApi.getAll();
      set({ events });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  createEvent: async (data) => {
    const event = await eventsApi.create(data);
    set((s) => ({ events: [...s.events, event].sort((a, b) => a.startDate.localeCompare(b.startDate)) }));
    return event;
  },

  updateEvent: async (id, data) => {
    const updated = await eventsApi.update(id, data);
    set((s) => ({ events: s.events.map((e) => (e.id === id ? updated : e)) }));
  },

  deleteEvent: async (id) => {
    cancelLocalAlarm(id).catch(() => {});
    await eventsApi.remove(id);
    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
  },

  reset: () => set({ events: [], isLoading: false, error: null }),
}));
