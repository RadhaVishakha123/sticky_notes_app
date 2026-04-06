import { create } from 'zustand';
import type { Todo, CreateTodoRequest, UpdateTodoRequest } from '@repo/types';
import { todosApi } from '../services/api';
import { cancelLocalAlarm } from '../utils/alarmManager';

interface TodosState {
  todos: Todo[];
  isLoading: boolean;
  error: string | null;

  // Actions — TODO: implement each using todosApi
  fetchTodos: () => Promise<void>;
  createTodo: (data: CreateTodoRequest) => Promise<Todo>;
  updateTodo: (id: string, data: UpdateTodoRequest) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  reset: () => void;
}

export const useTodosStore = create<TodosState>((set, get) => ({
  todos: [],
  isLoading: false,
  error: null,

  fetchTodos: async () => {
    set({ isLoading: true, error: null });
    try {
      const todos = await todosApi.getAll();
      set({ todos });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  createTodo: async (data) => {
    const todo = await todosApi.create(data);
    set((s) => ({ todos: [todo, ...s.todos] }));
    return todo;
  },

  updateTodo: async (id, data) => {
    // Optimistic update so the UI (progress circle, task list) responds instantly
    set((s) => ({ todos: s.todos.map((t) => (t.id === id ? { ...t, ...data } : t)) }));
    try {
      const updated = await todosApi.update(id, data);
      set((s) => ({ todos: s.todos.map((t) => (t.id === id ? updated : t)) }));
      // Reminders handled by backend push notifications
    } catch {
      // Revert by re-fetching on failure
      try { const todos = await todosApi.getAll(); set({ todos }); } catch { /* ignore */ }
    }
  },

  toggleTodo: async (id) => {
    const todo = get().todos.find((t) => t.id === id);
    if (!todo) return;
    await get().updateTodo(id, { completed: !todo.completed });
  },

  deleteTodo: async (id) => {
    cancelLocalAlarm(id).catch(() => {});
    await todosApi.remove(id);
    set((s) => ({ todos: s.todos.filter((t) => t.id !== id) }));
  },

  reset: () => set({ todos: [], isLoading: false, error: null }),
}));
