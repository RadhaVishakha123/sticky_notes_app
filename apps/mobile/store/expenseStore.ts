import { create } from 'zustand';
import type { Expense, CreateExpenseRequest } from '@repo/types';
import { expensesApi } from '../services/api';

export type { Expense };
export type ExpenseCategory = Expense['category'];

interface ExpenseState {
  expenses: Expense[];
  budget: number;
  isLoading: boolean;
  error: string | null;

  fetchExpenses: () => Promise<void>;
  createExpense: (data: CreateExpenseRequest) => Promise<void>;
  updateExpense: (id: string, data: CreateExpenseRequest) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setBudget: (amount: number) => Promise<void>;
  reset: () => void;
}

export const useExpenseStore = create<ExpenseState>((set) => ({
  expenses: [],
  budget: 0,
  isLoading: false,
  error: null,

  fetchExpenses: async () => {
    set({ isLoading: true, error: null });
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const [expenses, budget] = await Promise.all([
        expensesApi.getAll(),
        expensesApi.getBudget(currentMonth),
      ]);
      set({ expenses, budget });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  createExpense: async (data) => {
    const expense = await expensesApi.create(data);
    set((s) => ({ expenses: [expense, ...s.expenses] }));
  },

  updateExpense: async (id, data) => {
    const expense = await expensesApi.update(id, data);
    set((s) => ({ expenses: s.expenses.map((e) => e.id === id ? expense : e) }));
  },

  deleteExpense: async (id) => {
    await expensesApi.remove(id);
    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }));
  },

  setBudget: async (amount) => {
    const month = new Date().toISOString().slice(0, 7);
    const updated = await expensesApi.setBudget(month, amount);
    set({ budget: updated });
  },

  reset: () => set({ expenses: [], budget: 0, isLoading: false, error: null }),
}));
