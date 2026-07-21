import { NOTIFICATION_CHANNEL } from '../../config/constants.js';

const { EMAIL, IN_APP, PUSH } = NOTIFICATION_CHANNEL;

function message(title, body, channels) {
  return Object.freeze({ title, body, channels });
}

export const notificationTemplates = Object.freeze({
  registration_verify: () =>
    message(
      'Confirm your email',
      'Tap the link to confirm your email and get started with RozVisit.',
      [EMAIL],
    ),
  application_received: () =>
    message(
      'We received your application',
      'Thank you for applying. We will review your details and be in touch soon.',
      [IN_APP, EMAIL],
    ),
  admin_new_application: () =>
    message('New caregiver application', 'A new caregiver application is ready for review.', [
      IN_APP,
    ]),
  application_decision: ({ decision }) =>
    message(
      'Update on your application',
      decision === 'approve'
        ? 'Good news -- your application is approved. Welcome to RozVisit.'
        : decision === 'reject'
          ? 'Thank you for applying. We are not able to move forward at this time.'
          : 'We need a bit more information to continue your application.',
      [IN_APP, EMAIL],
    ),
  subscription_active: ({ parentName, planKey }) =>
    message(
      'Your plan is active',
      `Your ${planKey} plan is now active. You can schedule visits for ${parentName}.`,
      [IN_APP, EMAIL],
    ),
  admin_payment_reconciled: ({ clientName }) =>
    message('Payment recorded', `A payment has been recorded for ${clientName}'s subscription.`, [
      IN_APP,
    ]),
  visit_assigned: ({ caregiverName, parentName, scheduledDate }) =>
    message(
      'A caregiver has been assigned',
      `${caregiverName} will visit ${parentName} on ${scheduledDate}.`,
      [IN_APP, PUSH],
    ),
  visit_changed: ({ parentName, scheduledDate }) =>
    message(
      'Your visit was updated',
      `Your visit for ${parentName} on ${scheduledDate} has been updated.`,
      [IN_APP, PUSH],
    ),
  weekly_reschedule_reminder: ({ parentName }) =>
    message(
      'Set next week’s visits',
      `You can now choose next week’s visit times for ${parentName}. If you do not make changes, this week’s schedule will continue automatically.`,
      [IN_APP, PUSH],
    ),
  visit_completed: ({ caregiverName, parentName }) =>
    message(
      'Visit complete',
      `${caregiverName} completed today's visit with ${parentName}. See the details in your feed.`,
      [IN_APP, PUSH],
    ),
  visit_missed: ({ parentName }) =>
    message(
      'A visit was missed',
      `Today's visit with ${parentName} did not happen. We are looking into it.`,
      [IN_APP, PUSH, EMAIL],
    ),
  visit_parent_declined: ({ parentName }) =>
    message(
      "Your parent declined today's visit",
      `${parentName} chose not to have today's visit. No action is needed from you.`,
      [IN_APP, EMAIL],
    ),
  consent_withdrawn: ({ parentName }) =>
    message(
      'Consent was withdrawn',
      `${parentName} has withdrawn consent for visits. Scheduling is paused until this is resolved.`,
      [IN_APP, EMAIL],
    ),
  subscription_grace: ({ planKey }) =>
    message(
      'Your plan needs renewal',
      `Your ${planKey} plan is in a grace period. Please renew to avoid a pause in visits.`,
      [IN_APP, EMAIL],
    ),
  subscription_paused: ({ planKey }) =>
    message(
      'Your plan is paused',
      `Your ${planKey} plan is now paused. Renew anytime to resume visits.`,
      [IN_APP, EMAIL],
    ),
  subscription_cancelled: ({ planKey }) =>
    message(
      'Your plan was cancelled',
      `Your ${planKey} plan has been cancelled. You can view your visit history anytime.`,
      [IN_APP, EMAIL],
    ),
  flag_raised: ({ parentName, reason }) =>
    message('A visit needs attention', `A visit for ${parentName} has been flagged: ${reason}.`, [
      IN_APP,
    ]),
});

export function renderNotification(type, values = {}) {
  const template = notificationTemplates[type];
  if (!template) throw new Error(`Unknown notification template: ${type}`);
  return template(values);
}
