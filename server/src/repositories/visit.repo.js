import mongoose from 'mongoose';
import { Visit } from '../models/Visit.js';

export const visitRepository = Object.freeze({
  createMany(data) {
    return Visit.insertMany(data);
  },
  async upsertScheduled(records) {
    if (!records.length) return [];
    await Visit.bulkWrite(
      records.map((record) => ({
        updateOne: {
          filter: { clientVisitId: record.clientVisitId },
          update: { $setOnInsert: record },
          upsert: true,
        },
      })),
      { ordered: false },
    );
    return Visit.find({
      clientVisitId: { $in: records.map((record) => record.clientVisitId) },
    }).sort({
      scheduledAt: 1,
    });
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
  findMineByCaregiver(caregiverId, { before, limit }) {
    return Visit.find({
      caregiverId,
      ...(before ? { scheduledAt: { $lt: before } } : {}),
    })
      .sort({ scheduledAt: -1 })
      .limit(limit);
  },
  findWeekBySubscription(subscriptionId, start, end) {
    return Visit.find({ subscriptionId, scheduledAt: { $gte: start, $lt: end } });
  },
  findForSubscriptionPeriod(subscriptionId, start, end) {
    return Visit.find({ subscriptionId, scheduledAt: { $gte: start, $lt: end } }).select(
      'clientVisitId scheduledAt status',
    );
  },
  findFeedByParent(parentId, limit) {
    return Visit.find({ parentId }).sort({ scheduledAt: -1 }).limit(limit);
  },
  findMostRecentAssignedCaregiverForParent(parentId, before) {
    return Visit.findOne({
      parentId,
      caregiverId: { $ne: null },
      ...(before ? { scheduledAt: { $lt: before } } : {}),
    })
      .sort({ scheduledAt: -1 })
      .select('caregiverId');
  },
  countScheduledTodayByCaregiverIds(caregiverIds, start, end) {
    return Visit.aggregate([
      {
        $match: {
          caregiverId: { $in: caregiverIds },
          scheduledAt: { $gte: start, $lt: end },
          status: 'scheduled',
        },
      },
      { $group: { _id: '$caregiverId', count: { $sum: 1 } } },
    ]);
  },
  findForAdmin({ caregiverId, from, limit, skip, status, to }) {
    const filter = {
      ...(status ? { status } : {}),
      ...(caregiverId ? { caregiverId } : {}),
      ...(from || to
        ? { scheduledAt: { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) } }
        : {}),
    };
    return Visit.find(filter)
      .populate('parentId', 'name')
      .populate('caregiverId', 'name')
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(limit);
  },
  countForAdmin({ caregiverId, from, status, to }) {
    return Visit.countDocuments({
      ...(status ? { status } : {}),
      ...(caregiverId ? { caregiverId } : {}),
      ...(from || to
        ? { scheduledAt: { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) } }
        : {}),
    });
  },
  findByIdForAdmin(id) {
    return mongoose.isValidObjectId(id)
      ? Visit.findById(id)
          .select('+checklist.note +flag.note')
          .populate('parentId', '+addressText clientId name')
          .populate('caregiverId', 'name')
      : null;
  },
  update(id, update) {
    return Visit.findByIdAndUpdate(id, update, { new: true, runValidators: true }).select(
      '+checklist.note',
    );
  },
});
