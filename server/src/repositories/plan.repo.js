import { CarePlan } from '../models/CarePlan.js';

export const planRepository = Object.freeze({
  findActive() {
    return CarePlan.find({ active: true }).sort({ visitsPerWeek: 1 });
  },
  findActiveByKey(key) {
    return CarePlan.findOne({ key, active: true });
  },
  upsertReferencePlans(plans) {
    return Promise.all(
      plans.map((plan) =>
        CarePlan.findOneAndUpdate(
          { key: plan.key },
          { $setOnInsert: plan },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        ),
      ),
    );
  },
});
