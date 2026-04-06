import { create } from 'zustand';

interface CalendarState {
  jumpDate: string | null;
  setJumpDate: (date: string | null) => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  jumpDate: null,
  setJumpDate: (date) => set({ jumpDate: date }),
}));
