import { assertNotificationChannel } from './NotificationChannel.js';

export const inAppChannel = assertNotificationChannel({
  async send() {},
});
