import { logger } from '../utils/logger.js';
import { assertNotificationChannel } from './NotificationChannel.js';

export const pushChannel = assertNotificationChannel({
  async send({ type }) {
    logger.info('notification.push_queued', { type });
  },
});
