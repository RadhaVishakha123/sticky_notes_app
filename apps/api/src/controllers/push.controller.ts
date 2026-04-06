import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { RegisterTokenInput, RemoveTokenInput } from '../validation/push.schema';

export class PushController {
  /**
   * POST /api/push/token
   * Register or update a device push token for the authenticated user.
   * body: { token: string; platform?: "android" | "ios" | "web" }
   */
  registerToken = async (req: AuthenticatedRequest & { body: RegisterTokenInput }, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, platform } = req.body;

      // Upsert: if the token already exists, update its userId/platform (device may have switched users)
      await prisma.deviceToken.upsert({
        where: { token },
        create: { token, platform: platform ?? null, userId: req.user!.id },
        update: { platform: platform ?? null, userId: req.user!.id },
      });

      res.status(200).json({ message: 'Token registered' });
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /api/push/token
   * Remove a device token (e.g. on logout).
   * body: { token: string }
   */
  removeToken = async (req: AuthenticatedRequest & { body: RemoveTokenInput }, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.body;
      await prisma.deviceToken.deleteMany({
        where: { token, userId: req.user!.id },
      });
      res.status(200).json({ message: 'Token removed' });
    } catch (err) {
      next(err);
    }
  };
}
