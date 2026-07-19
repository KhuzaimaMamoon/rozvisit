import mongoose from 'mongoose';
import { PLAN_NAMES } from '../config/constants.js';

const { Schema } = mongoose;
const currencies = ['USD', 'GBP', 'AED', 'SAR'];

const priceRangeSchema = new Schema(
  {
    min: { type: Number, required: true, min: 0 },
    max: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const carePlanSchema = new Schema(
  {
    key: { type: String, enum: Object.values(PLAN_NAMES), required: true, unique: true },
    visitsPerWeek: { type: Number, required: true, min: 1 },
    errandsPerWeek: { type: Number, default: null, min: 0 },
    prices: {
      USD: { type: priceRangeSchema, required: true },
      GBP: { type: priceRangeSchema, required: true },
      AED: { type: priceRangeSchema, required: true },
      SAR: { type: priceRangeSchema, required: true },
    },
    active: { type: Boolean, required: true, default: true },
  },
  { strict: 'throw', timestamps: true },
);

carePlanSchema.pre('validate', function validatePriceRanges(next) {
  if (currencies.some((currency) => this.prices[currency].min > this.prices[currency].max)) {
    this.invalidate(
      'prices',
      'Each currency range must have a minimum no greater than its maximum.',
    );
  }
  next();
});

export const CarePlan = mongoose.models.CarePlan ?? mongoose.model('CarePlan', carePlanSchema);
