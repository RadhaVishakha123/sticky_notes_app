import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  startDate: z.string().datetime({ message: 'startDate must be a valid ISO datetime' }),
  endDate: z.string().datetime({ message: 'endDate must be a valid ISO datetime' }),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  category: z.string().max(50).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  reminderAt: z.string().datetime().nullable().optional(),
  alarmAt:    z.string().datetime().nullable().optional(),
});

export const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  category: z.string().max(50).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  reminderAt: z.string().datetime().nullable().optional(),
  alarmAt:    z.string().datetime().nullable().optional(),
});

export const eventIdSchema = z.object({
  id: z.string().cuid('Invalid event ID'),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
