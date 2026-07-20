import { EventEmitter } from 'node:events';
import { NOTIFICATION_CHANNEL, NOTIFICATION_DELIVERY_STATE } from '../config/constants.js';
import { emailChannel } from '../interfaces/channel.email.js';
import { inAppChannel } from '../interfaces/channel.in-app.js';
import { pushChannel } from '../interfaces/channel.push.js';
import { notificationRepository } from '../repositories/notification.repo.js';
import { NotFoundError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const MAX_ATTEMPTS = 4;
const RETRY_DELAYS_MS = [30_000, 60_000, 120_000];
const channels = Object.freeze({
  [NOTIFICATION_CHANNEL.EMAIL]: emailChannel,
  [NOTIFICATION_CHANNEL.IN_APP]: inAppChannel,
  [NOTIFICATION_CHANNEL.PUSH]: pushChannel,
});
const eventBus = new EventEmitter();
const timers = new Map();

function serialize(notification) {
  return {
    body: notification.body,
    createdAt: notification.createdAt,
    deliveries: notification.deliveries.map((delivery) => ({
      attempts: delivery.attempts,
      channel: delivery.channel,
      failedPermanently: delivery.failedPermanently,
      lastAttemptAt: delivery.lastAttemptAt,
      nextAttemptAt: delivery.nextAttemptAt,
      state: delivery.state,
    })),
    id: notification._id.toString(),
    readAt: notification.readAt,
    title: notification.title,
    type: notification.type,
  };
}

function schedule(notificationId, channel, delay) {
  const key = `${notificationId}:${channel}`;
  clearTimeout(timers.get(key));
  const timer = setTimeout(() => {
    timers.delete(key);
    eventBus.emit('notification.deliver', notificationId, channel);
  }, delay);
  timer.unref?.();
  timers.set(key, timer);
}

async function deliver(notificationId, channel) {
  const notification = await notificationRepository.findById(notificationId);
  if (!notification) return;
  const delivery = notification.deliveries.find((entry) => entry.channel === channel);
  if (
    !delivery ||
    delivery.failedPermanently ||
    delivery.state === NOTIFICATION_DELIVERY_STATE.SENT
  ) {
    return;
  }

  delivery.attempts += 1;
  delivery.lastAttemptAt = new Date();
  try {
    await channels[channel].send({
      body: notification.body,
      notificationId: notification._id.toString(),
      title: notification.title,
      type: notification.type,
      userId: notification.userId.toString(),
    });
    delivery.nextAttemptAt = null;
    delivery.state = NOTIFICATION_DELIVERY_STATE.SENT;
    await notificationRepository.save(notification);
  } catch {
    if (delivery.attempts >= MAX_ATTEMPTS) {
      delivery.failedPermanently = true;
      delivery.nextAttemptAt = null;
      delivery.state = NOTIFICATION_DELIVERY_STATE.FAILED;
      await notificationRepository.save(notification);
      await notificationRepository.createFailure(notification._id);
      logger.error('notification.delivery_failed_permanently', {
        channel,
        notificationId: notification._id.toString(),
        type: notification.type,
      });
      return;
    }
    const retryDelay = RETRY_DELAYS_MS[delivery.attempts - 1];
    delivery.nextAttemptAt = new Date(Date.now() + retryDelay);
    delivery.state = NOTIFICATION_DELIVERY_STATE.RETRYING;
    await notificationRepository.save(notification);
    logger.warn('notification.delivery_retrying', {
      attempt: delivery.attempts,
      channel,
      notificationId: notification._id.toString(),
      type: notification.type,
    });
    schedule(notification._id.toString(), channel, retryDelay);
  }
}

eventBus.on('notification.deliver', (notificationId, channel) => {
  void deliver(notificationId, channel);
});

export const notificationService = Object.freeze({
  async list(userId, { before, limit = 20 }) {
    const result = await notificationRepository.listForUser({
      before: before ? new Date(before) : null,
      limit,
      userId,
    });
    return {
      items: result.items.map(serialize),
      nextBefore: result.items.at(-1)?.createdAt ?? null,
      unreadCount: result.unreadCount,
    };
  },
  async listFailures({ limit = 20, page = 1 }) {
    const items = await notificationRepository.listFailures({ limit, skip: (page - 1) * limit });
    return {
      items: items.map((failure) => ({
        id: failure._id.toString(),
        notification: failure.notificationId
          ? {
              id: failure.notificationId._id.toString(),
              title: failure.notificationId.title,
              type: failure.notificationId.type,
            }
          : null,
        notificationId: failure.notificationId?._id?.toString() ?? null,
        raisedAt: failure.createdAt,
        state: failure.state,
        type: failure.type,
      })),
      page,
    };
  },
  async markRead(userId, notificationId) {
    const notification = await notificationRepository.findOwnedById(userId, notificationId);
    if (!notification) throw new NotFoundError();
    if (!notification.readAt) {
      notification.readAt = new Date();
      await notificationRepository.save(notification);
    }
    return serialize(notification);
  },
  async notify({ body, channels: requestedChannels, idempotencyKey, title, type, userId }) {
    const existing = await notificationRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) return serialize(existing);
    let notification;
    try {
      notification = await notificationRepository.create({
        body,
        deliveries: requestedChannels.map((channel) => ({ channel })),
        idempotencyKey,
        title,
        type,
        userId,
      });
    } catch (error) {
      if (error?.code === 11000) {
        const duplicate = await notificationRepository.findByIdempotencyKey(idempotencyKey);
        if (duplicate) return serialize(duplicate);
      }
      throw error;
    }
    await Promise.all(
      requestedChannels.map((channel) => deliver(notification._id.toString(), channel)),
    );
    return serialize(notification);
  },
});
