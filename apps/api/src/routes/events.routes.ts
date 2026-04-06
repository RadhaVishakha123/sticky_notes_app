import { Router } from 'express';
import { EventsController } from '../controllers/events.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createEventSchema, eventIdSchema, updateEventSchema } from '../validation/event.schema';

export const eventsRouter: Router = Router();
const ctrl = new EventsController();

eventsRouter.use(authenticate);

// GET    /api/events
eventsRouter.get('/', ctrl.getEvents);

// POST   /api/events
eventsRouter.post('/', validate(createEventSchema), ctrl.createEvent);

// PUT    /api/events/:id
eventsRouter.put('/:id', validate(eventIdSchema, 'params'), validate(updateEventSchema), ctrl.updateEvent);

// DELETE /api/events/:id
eventsRouter.delete('/:id', validate(eventIdSchema, 'params'), ctrl.deleteEvent);
