import { notificationService } from '../services/notification.service.js';
import { renderNotification } from './templates/index.js';

export function notificationEventKey(type, recipientId, targetId) {
  return `${type}:${recipientId}:${targetId}`;
}

export async function notifyRecipient({ recipientId, targetId, type, values }) {
  const rendered = renderNotification(type, values);
  return notificationService.notify({
    ...rendered,
    idempotencyKey: notificationEventKey(type, recipientId, targetId),
    type,
    userId: recipientId,
  });
}
