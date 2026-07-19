import mongoose from 'mongoose';
import { Visit } from '../models/Visit.js';

export const visitRepository = Object.freeze({
  createMany(data) {
    return Visit.insertMany(data);
  },
  findById(id) {
    return mongoose.isValidObjectId(id) ? Visit.findById(id).select('+checklist.note') : null;
  },
  findFirstByParent(parentId) {
    return Visit.findOne({ parentId }).sort({ scheduledAt: 1 });
  },
  findTodayByCaregiver(caregiverId, start, end) {
    return Visit.find({ caregiverId, scheduledAt: { $gte: start, $lt: end } }).sort({
      scheduledAt: 1,
    });
  },
  findWeekBySubscription(subscriptionId, start, end) {
    return Visit.find({ subscriptionId, scheduledAt: { $gte: start, $lt: end } });
  },
  findFeedByParent(parentId, limit) {
    return Visit.find({ parentId }).sort({ scheduledAt: -1 }).limit(limit);
  },
  update(id, update) {
    return Visit.findByIdAndUpdate(id, update, { new: true, runValidators: true }).select(
      '+checklist.note',
    );
  },
});
