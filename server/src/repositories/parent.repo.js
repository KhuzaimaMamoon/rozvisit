import mongoose from 'mongoose';
import { ParentProfile } from '../models/ParentProfile.js';

const sensitiveSelection =
  '+addressText +careNotes +consent.recordingRef +consent.choices.preferredTimes +consent.choices.photoBoundaries +consent.choices.other';

export const parentRepository = Object.freeze({
  create(data) {
    return ParentProfile.create(data);
  },
  findByClientId(clientId) {
    return ParentProfile.find({ clientId }).select('-addressText -careNotes -consent.recordingRef');
  },
  findById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return ParentProfile.findById(id).select(sensitiveSelection);
  },
  updateOwned(id, clientId, update) {
    if (!mongoose.isValidObjectId(id)) return null;
    return ParentProfile.findOneAndUpdate({ _id: id, clientId }, update, {
      new: true,
      runValidators: true,
    }).select(sensitiveSelection);
  },
  withdrawConsent(id, update) {
    if (!mongoose.isValidObjectId(id)) return null;
    return ParentProfile.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).select(sensitiveSelection);
  },
  updateConsent(id, update) {
    if (!mongoose.isValidObjectId(id)) return null;
    return ParentProfile.findByIdAndUpdate(id, update, { new: true, runValidators: true }).select(
      sensitiveSelection,
    );
  },
});
