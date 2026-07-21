import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import { assertNotificationChannel } from './NotificationChannel.js';

const EMAIL_COLOR = Object.freeze({
  accent: '#7AA6B2',
  background: '#F8FAF9',
  border: '#DCE5E8',
  muted: '#6B7C85',
  primary: '#315A67',
  primarySoft: '#E7F0F2',
  surface: '#FFFFFF',
  text: '#18232A',
});

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
  const safeContent = escapeHtml(content);
  const safeLink = link ? escapeHtml(link) : null;
  const safeSubject = escapeHtml(subject);
  const action = safeLink
    ? `<tr>
        <td style="padding: 8px 32px 0;">
          <a href="${safeLink}" style="background: ${EMAIL_COLOR.primary}; border-radius: 8px; color: ${EMAIL_COLOR.surface}; display: inline-block; font-family: Arial, sans-serif; font-size: 16px; font-weight: 700; line-height: 24px; padding: 12px 22px; text-decoration: none;">${actionLabel}</a>
        </td>
      </tr>
      <tr>
        <td style="color: ${EMAIL_COLOR.muted}; font-family: Arial, sans-serif; font-size: 13px; line-height: 20px; padding: 20px 32px 0;">If the button does not work, copy and paste this link into your browser:<br /><a href="${safeLink}" style="color: ${EMAIL_COLOR.primary}; word-break: break-word;">${safeLink}</a></td>
      </tr>`
    : '';
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeSubject}</title>
  </head>
  <body style="background: ${EMAIL_COLOR.background}; margin: 0; padding: 0;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: ${EMAIL_COLOR.background};">
      <tr>
        <td align="center" style="padding: 32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: ${EMAIL_COLOR.surface}; border: 1px solid ${EMAIL_COLOR.border}; border-radius: 12px; max-width: 600px; overflow: hidden;">
            <tr>
              <td style="background: ${EMAIL_COLOR.primary}; color: ${EMAIL_COLOR.surface}; font-family: Arial, sans-serif; font-size: 24px; font-weight: 700; letter-spacing: -0.4px; padding: 24px 32px;">RozVisit</td>
            </tr>
            <tr>
              <td style="color: ${EMAIL_COLOR.primary}; font-family: Arial, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.8px; padding: 32px 32px 8px; text-transform: uppercase;">Care coordination update</td>
            </tr>
            <tr>
              <td style="color: ${EMAIL_COLOR.text}; font-family: Arial, sans-serif; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; line-height: 34px; padding: 0 32px;">${safeSubject}</td>
            </tr>
            <tr>
              <td style="color: ${EMAIL_COLOR.text}; font-family: Arial, sans-serif; font-size: 16px; line-height: 25px; padding: 18px 32px 16px;">${safeContent}</td>
            </tr>
            ${action}
            <tr>
              <td style="padding: 32px;">
                <div style="background: ${EMAIL_COLOR.primarySoft}; border-left: 3px solid ${EMAIL_COLOR.accent}; color: ${EMAIL_COLOR.muted}; font-family: Arial, sans-serif; font-size: 13px; line-height: 20px; padding: 12px 14px;">RozVisit keeps care coordination clear and accountable.</div>
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px;">
            <tr>
              <td align="center" style="color: ${EMAIL_COLOR.muted}; font-family: Arial, sans-serif; font-size: 12px; line-height: 18px; padding: 18px 24px 0;">This is an automated RozVisit message.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  return { html, subject, text };
}

export function createEmailChannel({
  apiKey = env.email.resendApiKey,
  createClient = (key) => new Resend(key),
  createGmailTransport = (options) => nodemailer.createTransport(options),
  devLogAuthLinks = env.devLogAuthLinks,
  enableDelivery = !process.env.JEST_WORKER_ID,
  fromAddress = env.email.fromAddress,
  gmailAppPassword = env.email.gmailAppPassword,
  gmailUser = env.email.gmailUser,
  log = logger,
} = {}) {
  // Gmail SMTP is a short-term bridge for real-user testing. It has sending
  // limits and is not the long-term production delivery provider; Resend is
  // retained as the fallback once its custom sender domain is verified.
  const gmailTransport =
    gmailUser && gmailAppPassword && enableDelivery
      ? createGmailTransport({
          service: 'gmail',
          auth: { user: gmailUser, pass: gmailAppPassword },
          connectionTimeout: 10_000,
          greetingTimeout: 10_000,
          socketTimeout: 10_000,
        })
      : null;
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
      if ((gmailTransport || client) && !to) {
        throw new Error('Email delivery requires a recipient address.');
      }
      if (gmailTransport) {
        try {
          const response = await gmailTransport.sendMail({
            from: gmailUser,
            to,
            ...messageFor({ body, link, title, type }),
          });
          log.info('notification.email_sent', { delivery: 'gmail_smtp', type });
          return response;
        } catch (error) {
          if (!client) throw error;
          log.warn('notification.gmail_smtp_failed', { type, error: error.message });
        }
      }
      if (!client) {
        log.info('notification.email_queued', { delivery: 'noop', type });
        return { delivery: 'noop' };
      }
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
