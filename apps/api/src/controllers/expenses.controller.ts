import { Response, NextFunction } from 'express';
import { ExpensesService } from '../services/expenses.service';
import { AuthenticatedRequest } from '../middleware/auth';
import { CreateExpenseInput, UpdateExpenseInput, SetBudgetInput, UpdateExpenseSettingsInput } from '../validation/expense.schema';

export class ExpensesController {
  private readonly service = new ExpensesService();

  getExpenses = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const expenses = await this.service.getExpenses(req.user!.id);
      res.json({ data: expenses });
    } catch (err) {
      next(err);
    }
  };

  createExpense = async (
    req: AuthenticatedRequest & { body: CreateExpenseInput },
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const expense = await this.service.createExpense(req.user!.id, req.body);
      res.status(201).json({ data: expense });
    } catch (err) {
      next(err);
    }
  };

  updateExpense = async (
    req: AuthenticatedRequest & { body: UpdateExpenseInput; params: { id: string } },
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const expense = await this.service.updateExpense(req.user!.id, req.params.id, req.body);
      res.json({ data: expense });
    } catch (err) {
      next(err);
    }
  };

  deleteExpense = async (
    req: AuthenticatedRequest & { params: { id: string } },
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.service.deleteExpense(req.user!.id, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  getBudget = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const month = (req.query.month as string) ?? new Date().toISOString().slice(0, 7);
      const amount = await this.service.getBudget(req.user!.id, month);
      res.json({ data: { amount } });
    } catch (err) {
      next(err);
    }
  };

  setBudget = async (
    req: AuthenticatedRequest & { body: SetBudgetInput },
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const amount = await this.service.setBudget(req.user!.id, req.body.month, req.body.amount);
      res.json({ data: { amount } });
    } catch (err) {
      next(err);
    }
  };

  getExpenseSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const settings = await this.service.getExpenseSettings(req.user!.id);
      res.json({ data: settings });
    } catch (err) {
      next(err);
    }
  };

  updateExpenseSettings = async (
    req: AuthenticatedRequest & { body: UpdateExpenseSettingsInput },
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const settings = await this.service.updateExpenseSettings(req.user!.id, req.body);
      res.json({ data: settings });
    } catch (err) {
      next(err);
    }
  };
}
