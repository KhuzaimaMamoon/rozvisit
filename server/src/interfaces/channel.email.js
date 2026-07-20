import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import { assertNotificationChannel } from './NotificationChannel.js';

export const emailChannel = assertNotificationChannel({
  async send({ type, link }) {
    logger.info('notification.email_queued', { type });
    if (env.devLogAuthLinks && link) {
      logger.warn('dev.auth_link', {
        notice: 'DEV ONLY - DO NOT ENABLE IN PRODUCTION',
        link,
        type,
      });
    }
  },
});
