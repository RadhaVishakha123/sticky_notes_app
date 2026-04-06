import { Router } from 'express';
import { PushController } from '../controllers/push.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerTokenSchema, removeTokenSchema } from '../validation/push.schema';

export const pushRouter: Router = Router();
const ctrl = new PushController();

pushRouter.use(authenticate);

// POST   /api/push/token  — register device token
pushRouter.post('/token', validate(registerTokenSchema), ctrl.registerToken);

// DELETE /api/push/token  — remove device token (logout)
pushRouter.delete('/token', validate(removeTokenSchema), ctrl.removeToken);
