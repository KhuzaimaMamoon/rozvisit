import { Resend } from 'resend';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import { assertNotificationChannel } from './NotificationChannel.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function messageFor({ body, link, title, type }) {
  const content =
    body ??
    (type === 'email_verification'
      ? 'Confirm your email address to get started with RozVisit.'
      : 'Use the secure link below to reset your RozVisit password.');
  const subject =
    title ?? (type === 'email_verification' ? 'Confirm your email' : 'Reset your password');
  const actionLabel = type === 'email_verification' ? 'Confirm email' : 'Reset password';
  const text = link ? `${content}\n\n${actionLabel}: ${link}` : content;
  const html = link
    ? `<p>${escapeHtml(content)}</p><p><a href="${escapeHtml(link)}">${actionLabel}</a></p>`
    : `<p>${escapeHtml(content)}</p>`;
  return { html, subject, text };
}

export function createEmailChannel({
  apiKey = env.email.resendApiKey,
  createClient = (key) => new Resend(key),
  devLogAuthLinks = env.devLogAuthLinks,
  enableDelivery = !process.env.JEST_WORKER_ID,
  fromAddress = env.email.fromAddress,
  log = logger,
} = {}) {
  const client = apiKey && enableDelivery ? createClient(apiKey) : null;
  return assertNotificationChannel({
    async send({ body, link, title, to, type }) {
      if (devLogAuthLinks && link) {
        log.warn('dev.auth_link', {
          notice: 'DEV ONLY - DO NOT ENABLE IN PRODUCTION',
          link,
          type,
        });
      }
      if (!client) {
        log.info('notification.email_queued', { delivery: 'noop', type });
        return { delivery: 'noop' };
      }
      if (!to) throw new Error('Email delivery requires a recipient address.');

      const response = await client.emails.send({
        from: fromAddress,
        to: [to],
        ...messageFor({ body, link, title, type }),
      });
      if (response.error)
        throw new Error(`Resend email delivery failed: ${response.error.message}`);

      log.info('notification.email_sent', { type });
      return response.data;
    },
  });
}

export const emailChannel = createEmailChannel();
