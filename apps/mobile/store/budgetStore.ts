import { create } from 'zustand';
import { expensesApi } from '../services/api';

interface BudgetState {
  budgets: Record<string, number>; // cache: month → amount
  isLoading: boolean;
  getBudgetForMonth: (month: string) => number;
  fetchBudgetForMonth: (month: string) => Promise<void>;
  setBudgetForMonth: (month: string, amount: number) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: {},
  isLoading: false,

  getBudgetForMonth: (month) => get().budgets[month] ?? 0,

  fetchBudgetForMonth: async (month) => {
    set({ isLoading: true });
    try {
      const amount = await expensesApi.getBudget(month);
      set((s) => ({ budgets: { ...s.budgets, [month]: amount } }));
    } catch {
      // keep cached value on error
    } finally {
      set({ isLoading: false });
    }
  },

  setBudgetForMonth: async (month, amount) => {
    set((s) => ({ budgets: { ...s.budgets, [month]: amount } })); // optimistic
    try {
      const saved = await expensesApi.setBudget(month, amount);
      set((s) => ({ budgets: { ...s.budgets, [month]: saved } }));
    } catch {
      // revert optimistic update on error
      set((s) => {
        const { [month]: _, ...rest } = s.budgets;
        return { budgets: rest };
      });
    }
  },
}));
