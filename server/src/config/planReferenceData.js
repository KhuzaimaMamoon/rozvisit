import { PLAN_NAMES } from './constants.js';

// Recommendation, pending Phase 0 evidence (D-03): display ranges, not confirmed prices.
export const PLAN_REFERENCE_DATA = Object.freeze([
  {
    key: PLAN_NAMES.BASIC,
    visitsPerWeek: 1,
    errandsPerWeek: 0,
    prices: {
      USD: { min: 25, max: 35 },
      GBP: { min: 20, max: 28 },
      AED: { min: 90, max: 130 },
      SAR: { min: 95, max: 135 },
    },
    active: true,
  },
  {
    key: PLAN_NAMES.STANDARD,
    visitsPerWeek: 3,
    errandsPerWeek: 1,
    prices: {
      USD: { min: 45, max: 60 },
      GBP: { min: 35, max: 48 },
      AED: { min: 165, max: 220 },
      SAR: { min: 170, max: 230 },
    },
    active: true,
  },
  {
    key: PLAN_NAMES.PREMIUM,
    visitsPerWeek: 7,
    errandsPerWeek: null,
    prices: {
      USD: { min: 75, max: 95 },
      GBP: { min: 60, max: 75 },
      AED: { min: 275, max: 350 },
      SAR: { min: 285, max: 360 },
    },
    active: true,
  },
]);
