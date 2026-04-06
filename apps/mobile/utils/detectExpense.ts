import { notesApi } from '../services/api';
import type { ExpenseCategory } from '../store/expenseStore';

export interface DetectedExpense {
  amount: number;
  title: string;
  category: ExpenseCategory;
  snippet: string;
}

const VALID_CATEGORIES: ExpenseCategory[] = ['Food', 'Transport', 'Shopping', 'Health', 'Bills', 'Other'];

export async function detectAllExpenses(text: string): Promise<DetectedExpense[]> {
  if (!text.trim()) return [];
  try {
    const results = await notesApi.detectExpenses(text);
    return results
      .filter((item) => VALID_CATEGORIES.includes(item.category as ExpenseCategory))
      .map((item) => ({
        amount: item.amount,
        title: item.title,
        category: item.category as ExpenseCategory,
        snippet: item.snippet,
      }));
  } catch {
    return [];
  }
}
