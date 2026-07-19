import { PLAN_NAMES, SUBSCRIPTION_STATE } from '../config/constants.js';

const currencies = new Set(['USD', 'GBP', 'AED', 'SAR']);
const adminStates = new Set([
  SUBSCRIPTION_STATE.LINK_SENT,
  SUBSCRIPTION_STATE.ACTIVE,
  SUBSCRIPTION_STATE.PAUSED,
]);

function failure(fields) {
  return { success: false, error: { flatten: () => ({ fieldErrors: fields }) } };
}

export const selectPlanSchema = {
  safeParse(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return failure({ form: ['Please select a plan for a parent.'] });
    }
    const fields = {};
    if (typeof value.parentId !== 'string' || !value.parentId.trim()) {
      fields.parentId = ['Please select a parent.'];
    }
    if (!Object.values(PLAN_NAMES).includes(value.planKey)) {
      fields.planKey = ['Please select one of the available plans.'];
    }
    return Object.keys(fields).length
      ? failure(fields)
      : { success: true, data: { parentId: value.parentId, planKey: value.planKey } };
  },
};

export const updateSubscriptionStateSchema = {
  safeParse(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return failure({ form: ['Please provide the subscription state.'] });
    }
    const fields = {};
    if (!adminStates.has(value.state)) fields.state = ['Please select a supported state.'];

    const data = {
      state: value.state,
      paymentRef: typeof value.paymentRef === 'string' ? value.paymentRef.trim() : null,
      price: value.price,
      currency: value.currency,
    };
    if (value.state === SUBSCRIPTION_STATE.ACTIVE) {
      if (!data.paymentRef) fields.paymentRef = ['A payment reference is required to activate.'];
      if (value.price !== undefined && (!Number.isFinite(value.price) || value.price <= 0)) {
        fields.price = ['Enter a positive agreed price.'];
      }
      if (value.currency !== undefined && !currencies.has(value.currency)) {
        fields.currency = ['Choose USD, GBP, AED, or SAR.'];
      }
    }

    return Object.keys(fields).length ? failure(fields) : { success: true, data };
  },
};
