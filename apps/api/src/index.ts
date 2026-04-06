import 'dotenv/config';
import { createApp } from './app';
import { env } from './config';
import { startReminderJob } from './jobs/reminder.job';
import { ensureBucketPublic } from './services/storage.service';

const app = createApp();
const port = env.PORT;

app.listen(port, '0.0.0.0', () => {
  console.info(`[server] Running on http://0.0.0.0:${port} (${env.NODE_ENV})`);
  startReminderJob();
  ensureBucketPublic();
});

// Graceful shutdown
const shutdown = () => {
  console.info('[server] Shutting down gracefully...');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
