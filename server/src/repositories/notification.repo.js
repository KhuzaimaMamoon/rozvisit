import { Notification } from '../models/Notification.js';
import { NotificationFailure } from '../models/NotificationFailure.js';

export const notificationRepository = Object.freeze({
  create(data) {
    return Notification.create(data);
  },
  createFailure(notificationId) {
    return NotificationFailure.findOneAndUpdate(
      { notificationId },
      { $setOnInsert: { notificationId } },
      { new: true, upsert: true },
    );
  },
  findById(id) {
    return Notification.findById(id);
  },
  findByIdempotencyKey(idempotencyKey) {
    return Notification.findOne({ idempotencyKey });
  },
  findOwnedById(userId, id) {
    return Notification.findOne({ _id: id, userId });
  },
  listFailures({ limit, skip }) {
    return NotificationFailure.find({ state: 'open' })
      .populate({ path: 'notificationId', select: 'type userId title createdAt deliveries' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  },
  async listForUser({ before, limit, userId }) {
    const filter = { userId };
    if (before) filter.createdAt = { $lt: before };
    const [items, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(limit),
      Notification.countDocuments({ userId, readAt: null }),
    ]);
    return { items, unreadCount };
  },
  save(notification) {
    return notification.save();
  },
});
