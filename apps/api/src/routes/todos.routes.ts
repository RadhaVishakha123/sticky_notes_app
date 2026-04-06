import { Router } from 'express';
import { TodosController } from '../controllers/todos.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createTodoSchema, todoIdSchema, updateTodoSchema } from '../validation/todo.schema';

export const todosRouter: Router = Router();
const ctrl = new TodosController();

// All todo routes require authentication
todosRouter.use(authenticate);

// GET    /api/todos
todosRouter.get('/', ctrl.getTodos);

// POST   /api/todos
todosRouter.post('/', validate(createTodoSchema), ctrl.createTodo);

// PUT    /api/todos/:id
todosRouter.put('/:id', validate(todoIdSchema, 'params'), validate(updateTodoSchema), ctrl.updateTodo);

// DELETE /api/todos/:id
todosRouter.delete('/:id', validate(todoIdSchema, 'params'), ctrl.deleteTodo);
