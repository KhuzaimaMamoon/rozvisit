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

function brevoDeliveryError(error, statusCode = null) {
  const details = error && typeof error === 'object' ? error : {};
  const responseCode = statusCode ?? details.statusCode ?? details.status ?? null;
  const message = details.message ?? 'Brevo rejected the email delivery request.';
  const wrapped = new Error(`Brevo email delivery failed: ${message}`);

  wrapped.name = details.name ?? 'BrevoDeliveryError';
  wrapped.code = details.code ?? null;
  wrapped.responseCode = responseCode;
  wrapped.statusCode = responseCode;
  // Deliberately retain only provider diagnostics, never a recipient, token,
  // API key, or the request payload.
  wrapped.providerDetails = {
    code: details.code ?? null,
    message,
    name: details.name ?? null,
    statusCode: responseCode,
  };
  return wrapped;
}

async function parseBrevoResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export function createEmailChannel({
  apiKey = env.email.brevoApiKey,
  createGmailTransport = (options) => nodemailer.createTransport(options),
  devLogAuthLinks = env.devLogAuthLinks,
  enableDelivery = !process.env.JEST_WORKER_ID,
  fromAddress = env.email.fromAddress,
  gmailAppPassword = env.email.gmailAppPassword,
  gmailSmtpPort = env.email.gmailSmtpPort,
  gmailUser = env.email.gmailUser,
  log = logger,
  nodeEnv = env.nodeEnv,
  sendRequest = globalThis.fetch,
} = {}) {
  // Render blocks Gmail's SMTP ports 465 and 587. Keep this transport for a
  // future SMTP-capable host, but never attempt it from a production process.
  const gmailEnabled = nodeEnv !== 'production';
  const gmailTransport =
    gmailEnabled && gmailUser && gmailAppPassword && enableDelivery
      ? createGmailTransport({
          host: 'smtp.gmail.com',
          port: gmailSmtpPort,
          secure: gmailSmtpPort === 465,
          requireTLS: gmailSmtpPort === 587,
          auth: { user: gmailUser, pass: gmailAppPassword },
          connectionTimeout: 15_000,
          greetingTimeout: 15_000,
          socketTimeout: 15_000,
        })
      : null;
  const brevoEnabled = Boolean(apiKey && enableDelivery);
  return assertNotificationChannel({
    async send({ body, link, title, to, type }) {
      if (devLogAuthLinks && link) {
        log.warn('dev.auth_link', {
          notice: 'DEV ONLY - DO NOT ENABLE IN PRODUCTION',
          link,
          type,
        });
      }
      if ((gmailTransport || brevoEnabled) && !to) {
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
          if (!brevoEnabled) throw error;
          log.warn('notification.gmail_smtp_failed', { type, error: error.message });
        }
      }
      if (!brevoEnabled) {
        log.info('notification.email_queued', { delivery: 'noop', type });
        return { delivery: 'noop' };
      }
      const message = messageFor({ body, link, title, type });
      const response = await sendRequest('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { email: fromAddress, name: 'RozVisit' },
          to: [{ email: to }],
          subject: message.subject,
          htmlContent: message.html,
          textContent: message.text,
        }),
      });
      const responseBody = await parseBrevoResponse(response);
      if (!response.ok) throw brevoDeliveryError(responseBody, response.status);

      log.info('notification.email_sent', { delivery: 'brevo', provider: 'brevo', type });
      return responseBody;
    },
  });
}

export const emailChannel = createEmailChannel();
