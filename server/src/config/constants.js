export const ROLES = Object.freeze({
  CLIENT: 'client',
  CAREGIVER: 'caregiver',
  ADMIN: 'admin',
});

export const USER_STATUS = Object.freeze({ ACTIVE: 'active', DISABLED: 'disabled' });

export const PARENT_STATUS = Object.freeze({
  PENDING_CONSENT: 'pending_consent',
  ACTIVE: 'active',
  PAUSED: 'paused',
  ARCHIVED: 'archived',
});

export const CAREGIVER_STATUS = Object.freeze({
  APPLIED: 'applied',
  IN_REVIEW: 'in_review',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  DEACTIVATED: 'deactivated',
});

export const CONSENT_STATE = Object.freeze({
  PENDING: 'pending',
  GIVEN: 'given',
  DECLINED: 'declined',
  WITHDRAWN: 'withdrawn',
});

export const VISIT_STATUS = Object.freeze({
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  MISSED: 'missed',
  PARENT_DECLINED: 'parent_declined',
  FLAGGED: 'flagged',
});

export const SUBSCRIPTION_STATE = Object.freeze({
  SELECTED: 'selected',
  LINK_SENT: 'link_sent',
  ACTIVE: 'active',
  GRACE: 'grace',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
});

export const PLAN_NAMES = Object.freeze({
  BASIC: 'Basic',
  STANDARD: 'Standard',
  PREMIUM: 'Premium',
});

export const COUNTRY_CURRENCY_MAP = Object.freeze({
  AE: 'AED',
  GB: 'GBP',
  US: 'USD',
  SA: 'SAR',
});

export const DEFAULT_CURRENCY = 'USD';
