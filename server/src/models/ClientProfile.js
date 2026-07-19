import mongoose from 'mongoose';

const { Schema } = mongoose;

const clientProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    countryCode: { type: String, required: true, uppercase: true, trim: true },
    currency: { type: String, enum: ['USD', 'GBP', 'AED', 'SAR'], required: true },
  },
  { strict: 'throw', timestamps: true },
);

export const ClientProfile =
  mongoose.models.ClientProfile ?? mongoose.model('ClientProfile', clientProfileSchema);
