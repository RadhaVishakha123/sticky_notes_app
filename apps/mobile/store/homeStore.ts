import { create } from 'zustand';

export type HomeSegment = 'today' | 'notes' | 'events' | 'tasks';

interface HomeStore {
  homeSegment: HomeSegment;
  setHomeSegment: (s: HomeSegment) => void;
}

export const useHomeStore = create<HomeStore>((set) => ({
  homeSegment: 'today',
  setHomeSegment: (homeSegment) => set({ homeSegment }),
}));
