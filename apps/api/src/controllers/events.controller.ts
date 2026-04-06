import { Response, NextFunction } from 'express';
import { EventsService } from '../services/events.service';
import { AuthenticatedRequest } from '../middleware/auth';
import { CreateEventInput, UpdateEventInput } from '../validation/event.schema';

export class EventsController {
  private readonly service = new EventsService();

  getEvents = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const events = await this.service.getEvents(req.user!.id);
      res.json({ data: events });
    } catch (err) {
      next(err);
    }
  };

  createEvent = async (
    req: AuthenticatedRequest & { body: CreateEventInput },
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const event = await this.service.createEvent(req.user!.id, req.body);
      res.status(201).json({ data: event });
    } catch (err) {
      next(err);
    }
  };

  updateEvent = async (
    req: AuthenticatedRequest & { body: UpdateEventInput; params: { id: string } },
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const event = await this.service.updateEvent(req.user!.id, req.params.id, req.body);
      res.json({ data: event });
    } catch (err) {
      next(err);
    }
  };

  deleteEvent = async (
    req: AuthenticatedRequest & { params: { id: string } },
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.service.deleteEvent(req.user!.id, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
