import mongoose from 'mongoose';

const { Schema } = mongoose;

const auditEventSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, trim: true },
    targetType: { type: String, required: true, trim: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    detail: { type: Schema.Types.Mixed, required: true, default: {} },
    at: { type: Date, required: true },
  },
  { strict: 'throw', timestamps: false },
);

auditEventSchema.index({ actorId: 1, at: -1 });
auditEventSchema.index({ targetType: 1, targetId: 1 });

auditEventSchema.pre('save', function preventEdits(next) {
  if (!this.isNew) return next(new Error('Audit events are append-only.'));
  return next();
});

export const AuditEvent =
  mongoose.models.AuditEvent ?? mongoose.model('AuditEvent', auditEventSchema);
