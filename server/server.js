import mongoose from 'mongoose';
import { createApp } from './src/app.js';
import { env } from './src/config/env.js';
import { logger } from './src/utils/logger.js';
import { visitService } from './src/services/visit.service.js';

const app = createApp();

async function start() {
  try {
    await mongoose.connect(env.mongoUri);
    logger.info('database.connected');
    const gmailConfigured = env.email.gmailUser && env.email.gmailAppPassword;
    logger.info('email.delivery_configured', {
      provider: gmailConfigured ? 'gmail_smtp' : env.email.resendApiKey ? 'resend' : 'noop',
      ...(gmailConfigured
        ? {
            smtpPort: env.email.gmailSmtpPort,
            smtpSecurity: env.email.gmailSmtpPort === 465 ? 'implicit_tls' : 'starttls',
          }
        : {}),
    });
    const runWeeklyScheduling = () =>
      visitService.processWeeklyCycles().catch((error) => {
        logger.error('weekly_scheduling.failed', { error: error.message });
      });
    runWeeklyScheduling();
    const weeklySchedulingTimer = setInterval(runWeeklyScheduling, 60 * 60 * 1000);

    const server = app.listen(env.port, () => {
      logger.info('server.listening', { port: env.port, env: env.nodeEnv });
    });

    const shutdown = async (signal) => {
      logger.info('server.shutdown_start', { signal });
      server.close();
      clearInterval(weeklySchedulingTimer);
      await mongoose.connection.close();
      logger.info('server.shutdown_complete');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('server.start_failed', { error: error.message });
    process.exit(1);
  }
}

start();
