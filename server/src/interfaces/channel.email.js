import { logger } from '../utils/logger.js';
import { assertNotificationChannel } from './NotificationChannel.js';

export const emailChannel = assertNotificationChannel({
  async send({ type }) {
    logger.info('notification.email_queued', { type });
  },
});
