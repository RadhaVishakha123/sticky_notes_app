import { create } from 'zustand';
import type { Note, CreateNoteRequest, UpdateNoteRequest } from '@repo/types';
import { notesApi } from '../services/api';

interface NotesState {
  notes: Note[];
  isLoading: boolean;
  error: string | null;

  // Actions — TODO: implement each using notesApi
  fetchNotes: () => Promise<void>;
  createNote: (data: CreateNoteRequest) => Promise<Note>;
  updateNote: (id: string, data: UpdateNoteRequest) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  reset: () => void;
}

export const useNotesStore = create<NotesState>((set) => ({
  notes: [],
  isLoading: false,
  error: null,

  fetchNotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const notes = await notesApi.getAll();
      set({ notes });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  createNote: async (data) => {
    const note = await notesApi.create(data);
    set((s) => ({ notes: [note, ...s.notes] }));
    return note;
  },

  updateNote: async (id, data) => {
    // TODO: call notesApi.update, update in notes array
    const updated = await notesApi.update(id, data);
    set((s) => ({ notes: s.notes.map((n) => (n.id === id ? updated : n)) }));
  },

  deleteNote: async (id) => {
    // TODO: call notesApi.remove, filter from notes array
    await notesApi.remove(id);
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
  },

  reset: () => set({ notes: [], isLoading: false, error: null }),
}));
