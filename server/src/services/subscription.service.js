import { DEFAULT_CURRENCY, ROLES, SUBSCRIPTION_STATE } from '../config/constants.js';
import { parentRepository } from '../repositories/parent.repo.js';
import { planRepository } from '../repositories/plan.repo.js';
import { subscriptionRepository } from '../repositories/subscription.repo.js';
import { userRepository } from '../repositories/user.repo.js';
import { notifyRecipient } from '../notifications/dispatch.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../utils/AppError.js';

const GRACE_PERIOD_MS = 5 * 24 * 60 * 60 * 1000;
const currencies = new Set(['USD', 'GBP', 'AED', 'SAR']);

function nextMonthlyPeriodEnd(from) {
  const end = new Date(from);
  end.setMonth(end.getMonth() + 1);
  return end;
}

function serializeSubscription(subscription) {
  return {
    id: subscription._id.toString(),
    clientId: subscription.clientId.toString(),
    parentId: subscription.parentId.toString(),
    planKey: subscription.planKey,
    planSnapshot: subscription.planSnapshot,
    state: subscription.state,
    stateHistory: subscription.stateHistory.map((entry) => ({
      state: entry.state,
      at: entry.at,
      byUserId: entry.byUserId?.toString() ?? null,
      paymentRef: entry.paymentRef,
    })),
    currentPeriodEnd: subscription.currentPeriodEnd,
  };
}

function canTransition(from, to) {
  return (
    (from === SUBSCRIPTION_STATE.SELECTED && to === SUBSCRIPTION_STATE.LINK_SENT) ||
    (from === SUBSCRIPTION_STATE.LINK_SENT && to === SUBSCRIPTION_STATE.ACTIVE) ||
    (from === SUBSCRIPTION_STATE.GRACE &&
      (to === SUBSCRIPTION_STATE.ACTIVE || to === SUBSCRIPTION_STATE.PAUSED))
  );
}

function transitionTargetId(subscription) {
  const latest = subscription.stateHistory.at(-1);
  return `${subscription._id}:${latest.at.toISOString()}`;
}

async function updateState(subscription, { state, byUserId = null, paymentRef = null, now }) {
  const update = {
    $set: { state },
    $push: { stateHistory: { state, at: now, byUserId, paymentRef } },
  };
  return subscriptionRepository.update(subscription._id, update);
}

export const subscriptionService = Object.freeze({
  async listPlans(clientId) {
    const [profile, plans] = await Promise.all([
      userRepository.findClientProfile(clientId),
      planRepository.findActive(),
    ]);
    if (!profile) throw new NotFoundError();
    const currency = currencies.has(profile.currency) ? profile.currency : DEFAULT_CURRENCY;
    return {
      items: plans.map((plan) => ({
        key: plan.key,
        visitsPerWeek: plan.visitsPerWeek,
        errandsPerWeek: plan.errandsPerWeek,
        price: plan.prices[currency],
        currency,
      })),
      ...(currency !== profile.currency ? { currencyFallback: true } : {}),
    };
  },

  async selectPlan(clientId, { parentId, planKey }) {
    const [parent, plan, existing] = await Promise.all([
      parentRepository.findById(parentId),
      planRepository.findActiveByKey(planKey),
      subscriptionRepository.findLatestByParent(parentId),
    ]);
    if (!parent) throw new NotFoundError();
    if (parent.clientId.toString() !== clientId) throw new ForbiddenError();
    if (!plan)
      throw new ValidationError('Please select one of the available plans.', {
        planKey: ['Please select one of the available plans.'],
      });
    if (existing) {
      throw new ConflictError('DUPLICATE', 'This parent already has a selected care plan.');
    }

    const now = new Date();
    const subscription = await subscriptionRepository.create({
      clientId,
      parentId,
      planKey: plan.key,
      planSnapshot: {
        visitsPerWeek: plan.visitsPerWeek,
        errandsPerWeek: plan.errandsPerWeek,
        price: null,
        currency: null,
      },
      state: SUBSCRIPTION_STATE.SELECTED,
      stateHistory: [{ state: SUBSCRIPTION_STATE.SELECTED, at: now, byUserId: clientId }],
    });
    return {
      ...serializeSubscription(subscription),
      nextStep: 'We will send your secure Payoneer payment link within 24 hours.',
    };
  },

  async getSubscription(actor, subscriptionId) {
    const subscription = await subscriptionRepository.findById(subscriptionId);
    if (!subscription) throw new NotFoundError();
    if (actor.role !== ROLES.ADMIN && subscription.clientId.toString() !== actor.sub) {
      throw new ForbiddenError();
    }
    return serializeSubscription(subscription);
  },

  async cancelSubscription(clientId, subscriptionId) {
    const subscription = await subscriptionRepository.findByIdAndClient(subscriptionId, clientId);
    if (!subscription) throw new NotFoundError();
    if (
      ![SUBSCRIPTION_STATE.ACTIVE, SUBSCRIPTION_STATE.GRACE, SUBSCRIPTION_STATE.PAUSED].includes(
        subscription.state,
      )
    ) {
      throw new ConflictError('STATE_INVALID', 'This subscription cannot be cancelled now.');
    }
    const updated = await updateState(subscription, {
      state: SUBSCRIPTION_STATE.CANCELLED,
      byUserId: clientId,
      now: new Date(),
    });
    await notifyRecipient({
      recipientId: updated.clientId,
      targetId: transitionTargetId(updated),
      type: 'subscription_cancelled',
      values: { planKey: updated.planKey },
    });
    return {
      ...serializeSubscription(updated),
      message: 'Your plan remains available until the end of the current paid period.',
    };
  },

  async updateAdminState(adminId, subscriptionId, { state, paymentRef, price, currency }) {
    const subscription = await subscriptionRepository.findById(subscriptionId);
    if (!subscription) throw new NotFoundError();
    if (!canTransition(subscription.state, state)) {
      throw new ConflictError('STATE_INVALID', 'This subscription cannot move to that state now.');
    }
    const now = new Date();
    const update = {
      $set: { state },
      $push: { stateHistory: { state, at: now, byUserId: adminId, paymentRef } },
    };

    if (state === SUBSCRIPTION_STATE.ACTIVE) {
      if (!paymentRef) {
        throw new ValidationError('A payment reference is required to activate.', {
          paymentRef: ['A payment reference is required to activate.'],
        });
      }
      if (subscription.planSnapshot.price === null) {
        if (!Number.isFinite(price) || price <= 0 || !currencies.has(currency)) {
          throw new ValidationError('Enter the agreed price and currency to activate.', {
            price: ['Enter a positive agreed price.'],
            currency: ['Choose USD, GBP, AED, or SAR.'],
          });
        }
        update.$set['planSnapshot.price'] = price;
        update.$set['planSnapshot.currency'] = currency;
      }
      update.$set.currentPeriodEnd = nextMonthlyPeriodEnd(now);
    }
    const updated = await subscriptionRepository.update(subscription._id, update);
    if (state === SUBSCRIPTION_STATE.ACTIVE) {
      const [parent, client, admins] = await Promise.all([
        parentRepository.findById(updated.parentId),
        userRepository.findById(updated.clientId),
        userRepository.findAdmins(),
      ]);
      if (!parent || !client) throw new NotFoundError();
      const targetId = transitionTargetId(updated);
      await Promise.all([
        notifyRecipient({
          recipientId: updated.clientId,
          targetId,
          type: 'subscription_active',
          values: { parentName: parent.name, planKey: updated.planKey },
        }),
        ...admins.map((admin) =>
          notifyRecipient({
            recipientId: admin._id,
            targetId,
            type: 'admin_payment_reconciled',
            values: { clientName: client.name },
          }),
        ),
      ]);
    }
    return serializeSubscription(updated);
  },

  async listAdminSubscriptions(state) {
    if (state && !Object.values(SUBSCRIPTION_STATE).includes(state)) {
      throw new ValidationError('Please select a supported state.', {
        state: ['Please select a supported state.'],
      });
    }
    const subscriptions = await subscriptionRepository.findByState(state);
    const items = await Promise.all(
      subscriptions.map(async (subscription) => {
        const [client, parent] = await Promise.all([
          userRepository.findById(subscription.clientId),
          parentRepository.findById(subscription.parentId),
        ]);
        return {
          ...serializeSubscription(subscription),
          clientName: client?.name ?? 'Unknown client',
          parentName: parent?.name ?? 'Unknown parent',
        };
      }),
    );
    return { items };
  },

  async applyGracePeriodTransitions(now = new Date()) {
    const subscriptions = await subscriptionRepository.findRenewalCandidates(now);
    const updates = [];
    for (const subscription of subscriptions) {
      const graceExpired =
        subscription.state === SUBSCRIPTION_STATE.GRACE &&
        now.getTime() >= subscription.currentPeriodEnd.getTime() + GRACE_PERIOD_MS;
      if (subscription.state === SUBSCRIPTION_STATE.ACTIVE) {
        const updated = await updateState(subscription, { state: SUBSCRIPTION_STATE.GRACE, now });
        updates.push(updated);
        await notifyRecipient({
          recipientId: updated.clientId,
          targetId: transitionTargetId(updated),
          type: 'subscription_grace',
          values: { planKey: updated.planKey },
        });
      } else if (graceExpired) {
        const updated = await updateState(subscription, { state: SUBSCRIPTION_STATE.PAUSED, now });
        updates.push(updated);
        await notifyRecipient({
          recipientId: updated.clientId,
          targetId: transitionTargetId(updated),
          type: 'subscription_paused',
          values: { planKey: updated.planKey },
        });
      }
    }
    return updates;
  },
});
