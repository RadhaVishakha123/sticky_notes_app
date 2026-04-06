import { Response, NextFunction } from 'express';
import { TodosService } from '../services/todos.service';
import { AuthenticatedRequest } from '../middleware/auth';
import { CreateTodoInput, UpdateTodoInput } from '../validation/todo.schema';

export class TodosController {
  private readonly service = new TodosService();

  getTodos = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // TODO: implement in TodosService
      const todos = await this.service.getTodos(req.user!.id);
      res.json({ data: todos });
    } catch (err) {
      next(err);
    }
  };

  createTodo = async (
    req: AuthenticatedRequest & { body: CreateTodoInput },
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // TODO: implement in TodosService
      const todo = await this.service.createTodo(req.user!.id, req.body);
      res.status(201).json({ data: todo });
    } catch (err) {
      next(err);
    }
  };

  updateTodo = async (
    req: AuthenticatedRequest & { body: UpdateTodoInput; params: { id: string } },
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // TODO: implement in TodosService
      const todo = await this.service.updateTodo(req.user!.id, req.params.id, req.body);
      res.json({ data: todo });
    } catch (err) {
      next(err);
    }
  };

  deleteTodo = async (
    req: AuthenticatedRequest & { params: { id: string } },
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // TODO: implement in TodosService
      await this.service.deleteTodo(req.user!.id, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
