import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';
import { env } from './config';
import { router } from './routes';
import { notFoundHandler } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import { prisma } from './config/database';

export function createApp(): Application {
  const app = express();

  // ── Security middleware ─────────────────────────────────────
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    cors({
      origin: env.NODE_ENV === 'production' ? env.CORS_ORIGINS : true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // ── Request parsing ─────────────────────────────────────────
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ── Logging ─────────────────────────────────────────────────
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  }

  // ── Health check ─────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── Web reset-password page ───────────────────────────────────
  app.get('/reset-password', async (req: Request, res: Response) => {
    const { token = '', email = '' } = req.query as { token?: string; email?: string };
    res.setHeader('Content-Type', 'text/html');

    // Check if token is still valid before showing the form
    let expired = false;
    if (token && email) {
      const user = await prisma.user.findUnique({ where: { email } }).catch(() => null);
      if (!user) {
        expired = true;
      } else {
        const record = await prisma.passwordResetToken.findFirst({
          where: { userId: user.id, token, expiresAt: { gt: new Date() } },
        }).catch(() => null);
        if (!record) expired = true;
      }
    } else {
      expired = true;
    }

    res.send(resetPasswordHtml({ token, email, error: '', success: false, expired }));
  });

  app.post('/reset-password', async (req: Request, res: Response) => {
    const { token, email, newPassword, confirmPassword } = req.body as Record<string, string>;

    if (!newPassword || newPassword.length < 8) {
      res.setHeader('Content-Type', 'text/html');
      res.send(resetPasswordHtml({ token, email, error: 'Password must be at least 8 characters.', success: false }));
      return;
    }
    if (newPassword !== confirmPassword) {
      res.setHeader('Content-Type', 'text/html');
      res.send(resetPasswordHtml({ token, email, error: 'Passwords do not match.', success: false }));
      return;
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error('invalid');

      const record = await prisma.passwordResetToken.findFirst({
        where: { userId: user.id, token, expiresAt: { gt: new Date() } },
      });
      if (!record) throw new Error('invalid');

      const hashed = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

      res.setHeader('Content-Type', 'text/html');
      res.send(resetPasswordHtml({ token, email, error: '', success: true }));
    } catch {
      res.setHeader('Content-Type', 'text/html');
      res.send(resetPasswordHtml({ token, email, error: 'Invalid or expired reset link. Please request a new one.', success: false }));
    }
  });

  // ── API routes ───────────────────────────────────────────────
  app.use('/api', router);

  // ── Error handling ───────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

function resetPasswordHtml({ token, email, error, success, expired = false }: {
  token: string; email: string; error: string; success: boolean; expired?: boolean;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Password — Sticky Notes</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           background: #0EA5E9; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #fff; border-radius: 24px; padding: 40px 32px; width: 100%; max-width: 420px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
    .logo { text-align: center; font-size: 22px; font-weight: 800; color: #0EA5E9; margin-bottom: 8px;
            display: flex; align-items: center; justify-content: center; gap: 8px; }
    .logo svg { width: 28px; height: 28px; }
    .subtitle { text-align: center; color: #64748B; font-size: 14px; margin-bottom: 32px; }
    label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
    input { width: 100%; padding: 14px 16px; border: 1.5px solid #E2E8F0; border-radius: 12px;
            font-size: 15px; outline: none; transition: border-color 0.2s; margin-bottom: 18px; }
    input:focus { border-color: #0EA5E9; }
    button { width: 100%; padding: 15px; background: #0EA5E9; color: #fff; border: none;
             border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; margin-top: 4px; }
    button:hover { background: #0284C7; }
    .error { background: #FEF2F2; color: #DC2626; border-radius: 10px; padding: 12px 16px;
             font-size: 13px; margin-bottom: 18px; display: flex; align-items: center; gap: 8px; }
    .error svg { flex-shrink: 0; width: 16px; height: 16px; }
    .success { text-align: center; }
    .success-icon { display: flex; justify-content: center; margin-bottom: 16px; }
    .success-icon svg { width: 64px; height: 64px; }
    .success-title { font-size: 22px; font-weight: 800; color: #16A34A; margin-bottom: 8px; }
    .success-msg { color: #64748B; font-size: 14px; line-height: 1.6; }
    .expired { text-align: center; }
    .expired-icon { display: flex; justify-content: center; margin-bottom: 16px; }
    .expired-icon svg { width: 64px; height: 64px; }
    .expired-title { font-size: 22px; font-weight: 800; color: #DC2626; margin-bottom: 8px; }
    .expired-msg { color: #64748B; font-size: 14px; line-height: 1.6; }
    input:disabled { background: #F1F5F9; color: #94A3B8; cursor: not-allowed; }
    button:disabled { background: #94A3B8; cursor: not-allowed; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
      Sticky Notes
    </div>
    <div class="subtitle">Reset your password</div>
    ${expired ? `
    <div class="expired">
      <div class="expired-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <div class="expired-title">Link Expired</div>
      <div class="expired-msg">This reset link has expired or already been used.<br/>Please request a new password reset from the app.</div>
    </div>
    ` : success ? `
    <div class="success">
      <div class="success-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
        </svg>
      </div>
      <div class="success-title">Password Updated!</div>
      <div class="success-msg">Your password has been changed successfully.<br/>You can now log in to the app with your new password.</div>
    </div>
    ` : `
    ${error ? `<div class="error"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${error}</div>` : ''}
    <form method="POST" action="/reset-password">
      <input type="hidden" name="token" value="${token}"/>
      <input type="hidden" name="email" value="${email}"/>
      <label>New Password</label>
      <input type="password" name="newPassword" placeholder="At least 8 characters" required minlength="8"/>
      <label>Confirm Password</label>
      <input type="password" name="confirmPassword" placeholder="Re-enter new password" required minlength="8"/>
      <button type="submit">Set New Password</button>
    </form>
    `}
  </div>
</body>
</html>`;
}
