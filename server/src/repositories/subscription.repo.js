import mongoose from 'mongoose';
import { SUBSCRIPTION_STATE } from '../config/constants.js';
import { Subscription } from '../models/Subscription.js';

export const subscriptionRepository = Object.freeze({
  create(data) {
    return Subscription.create(data);
  },
  findById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return Subscription.findById(id);
  },
  findByIdAndClient(id, clientId) {
    if (!mongoose.isValidObjectId(id)) return null;
    return Subscription.findOne({ _id: id, clientId });
  },
  findActiveByParent(parentId) {
    return Subscription.findOne({ parentId, state: SUBSCRIPTION_STATE.ACTIVE });
  },
  findLatestByParent(parentId) {
    return Subscription.findOne({ parentId }).sort({ updatedAt: -1 });
  },
  update(id, update) {
    return Subscription.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  },
  findByState(state) {
    return Subscription.find(state ? { state } : {}).sort({ updatedAt: -1 });
  },
  findRenewalCandidates(now) {
    return Subscription.find({
      state: { $in: [SUBSCRIPTION_STATE.ACTIVE, SUBSCRIPTION_STATE.GRACE] },
      currentPeriodEnd: { $lte: now },
    });
  },
  findWeeklySchedulingCandidates() {
    return Subscription.find({
      state: { $in: [SUBSCRIPTION_STATE.ACTIVE, SUBSCRIPTION_STATE.GRACE] },
    });
  },
});
