import { z } from 'zod';

export const registerTokenSchema = z.object({
  token:    z.string().min(1, 'token is required').max(4096),
  platform: z.enum(['android', 'ios', 'web']).optional(),
});

export const removeTokenSchema = z.object({
  token: z.string().min(1, 'token is required').max(4096),
});

export type RegisterTokenInput = z.infer<typeof registerTokenSchema>;
export type RemoveTokenInput   = z.infer<typeof removeTokenSchema>;
