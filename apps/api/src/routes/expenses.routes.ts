import { Router } from 'express';
import { ExpensesController } from '../controllers/expenses.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdSchema,
  setBudgetSchema,
  getBudgetQuerySchema,
  updateExpenseSettingsSchema,
} from '../validation/expense.schema';

export const expensesRouter: Router = Router();
const ctrl = new ExpensesController();

expensesRouter.use(authenticate);

// GET    /api/expenses
expensesRouter.get('/', ctrl.getExpenses);

// POST   /api/expenses
expensesRouter.post('/', validate(createExpenseSchema), ctrl.createExpense);

// GET    /api/expenses/budget  — must be before /:id
expensesRouter.get('/budget', validate(getBudgetQuerySchema, 'query'), ctrl.getBudget);

// PUT    /api/expenses/budget  — must be before /:id
expensesRouter.put('/budget', validate(setBudgetSchema), ctrl.setBudget);

// GET    /api/expenses/settings  — must be before /:id
expensesRouter.get('/settings', ctrl.getExpenseSettings);

// PUT    /api/expenses/settings  — must be before /:id
expensesRouter.put('/settings', validate(updateExpenseSettingsSchema), ctrl.updateExpenseSettings);

// PUT    /api/expenses/:id
expensesRouter.put('/:id', validate(expenseIdSchema, 'params'), validate(updateExpenseSchema), ctrl.updateExpense);

// DELETE /api/expenses/:id
expensesRouter.delete('/:id', validate(expenseIdSchema, 'params'), ctrl.deleteExpense);
