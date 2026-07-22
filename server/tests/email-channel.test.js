import { describe, expect, it, jest } from '@jest/globals';
import { createEmailChannel } from '../src/interfaces/channel.email.js';

describe('Email channel', () => {
  it('uses Gmail SMTP ahead of Resend when both delivery options are configured', async () => {
    const sendMail = jest.fn().mockResolvedValue({ messageId: 'gmail-1' });
    const createGmailTransport = jest.fn(() => ({ sendMail }));
    const resendSend = jest.fn();
    const createClient = jest.fn(() => ({ emails: { send: resendSend } }));
    const channel = createEmailChannel({
      apiKey: 're_test_key',
      createClient,
      createGmailTransport,
      enableDelivery: true,
      fromAddress: 'noreply@verified-resend.example',
      gmailAppPassword: 'abcdefghijklmnop',
      gmailSmtpPort: 465,
      gmailUser: 'rozvisit.testing@gmail.com',
      log: { info: jest.fn(), warn: jest.fn() },
    });

    await channel.send({
      body: 'Confirm your email address.',
      to: 'ayesha@example.com',
      type: 'email_verification',
    });

    expect(createGmailTransport).toHaveBeenCalledWith({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      requireTLS: false,
      auth: { user: 'rozvisit.testing@gmail.com', pass: 'abcdefghijklmnop' },
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 15_000,
    });
    expect(resendSend).not.toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'rozvisit.testing@gmail.com',
        to: 'ayesha@example.com',
      }),
    );
  });

  it('falls back to Resend when configured Gmail SMTP cannot deliver', async () => {
    const sendMail = jest.fn().mockRejectedValue(new Error('SMTP unavailable'));
    const send = jest.fn().mockResolvedValue({ data: { id: 'resend-1' }, error: null });
    const channel = createEmailChannel({
      apiKey: 're_test_key',
      createClient: () => ({ emails: { send } }),
      createGmailTransport: () => ({ sendMail }),
      enableDelivery: true,
      fromAddress: 'noreply@verified-resend.example',
      gmailAppPassword: 'abcdefghijklmnop',
      gmailUser: 'rozvisit.testing@gmail.com',
      log: { info: jest.fn(), warn: jest.fn() },
    });

    await channel.send({ to: 'ayesha@example.com', type: 'password_reset' });

    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('uses STARTTLS on port 587 when that transport mode is configured', async () => {
    const sendMail = jest.fn().mockResolvedValue({ messageId: 'gmail-587' });
    const createGmailTransport = jest.fn(() => ({ sendMail }));
    const channel = createEmailChannel({
      createGmailTransport,
      enableDelivery: true,
      gmailAppPassword: 'abcdefghijklmnop',
      gmailSmtpPort: 587,
      gmailUser: 'rozvisit.testing@gmail.com',
      log: { info: jest.fn(), warn: jest.fn() },
    });

    await channel.send({ to: 'ayesha@example.com', type: 'password_reset' });

    expect(createGmailTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.gmail.com',
        port: 587,
        requireTLS: true,
        secure: false,
      }),
    );
  });

  it('uses Resend without constructing an SMTP transport in production', async () => {
    const createGmailTransport = jest.fn();
    const send = jest.fn().mockResolvedValue({ data: { id: 'resend-production-1' }, error: null });
    const channel = createEmailChannel({
      apiKey: 're_test_key',
      createClient: () => ({ emails: { send } }),
      createGmailTransport,
      enableDelivery: true,
      fromAddress: 'onboarding@resend.dev',
      gmailAppPassword: 'abcdefghijklmnop',
      gmailUser: 'rozvisit.testing@gmail.com',
      log: { info: jest.fn(), warn: jest.fn() },
      nodeEnv: 'production',
    });

    await channel.send({ to: 'ayesha@example.com', type: 'email_verification' });

    expect(createGmailTransport).not.toHaveBeenCalled();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('preserves safe Resend rejection details for the retry logger', async () => {
    const send = jest.fn().mockResolvedValue({
      data: null,
      error: {
        code: 'validation_error',
        message: 'The sender domain is not verified.',
        name: 'validation_error',
        statusCode: 403,
      },
    });
    const channel = createEmailChannel({
      apiKey: 're_test_key',
      createClient: () => ({ emails: { send } }),
      enableDelivery: true,
      fromAddress: 'onboarding@resend.dev',
      log: { info: jest.fn(), warn: jest.fn() },
      nodeEnv: 'production',
    });

    await expect(
      channel.send({ to: 'ayesha@example.com', type: 'email_verification' }),
    ).rejects.toMatchObject({
      code: 'validation_error',
      message: 'Resend email delivery failed: The sender domain is not verified.',
      responseCode: 403,
      statusCode: 403,
      providerDetails: {
        code: 'validation_error',
        message: 'The sender domain is not verified.',
        name: 'validation_error',
        statusCode: 403,
      },
    });
  });

  it('delivers a Resend email when a dedicated API key is configured', async () => {
    const send = jest.fn().mockResolvedValue({ data: { id: 'email-1' }, error: null });
    const createClient = jest.fn(() => ({ emails: { send } }));
    const channel = createEmailChannel({
      apiKey: 're_test_key',
      createClient,
      enableDelivery: true,
      fromAddress: 'noreply@example.com',
      log: { info: jest.fn(), warn: jest.fn() },
    });

    await channel.send({
      body: 'Your Standard plan is active.',
      title: 'Your plan is active',
      to: 'ayesha@example.com',
      type: 'subscription_active',
    });

    expect(createClient).toHaveBeenCalledWith('re_test_key');
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'noreply@example.com',
        html: expect.stringContaining('RozVisit'),
        subject: 'Your plan is active',
        text: 'Your Standard plan is active.',
        to: ['ayesha@example.com'],
      }),
    );
    expect(send.mock.calls[0][0].html).toContain('Your Standard plan is active.');
  });

  it('uses no-op delivery without a Resend key while retaining the development auth-link log', async () => {
    const log = { info: jest.fn(), warn: jest.fn() };
    const createClient = jest.fn();
    const channel = createEmailChannel({
      apiKey: null,
      createClient,
      devLogAuthLinks: true,
      log,
    });

    await expect(
      channel.send({
        link: 'http://localhost:5173/reset?token=single-use-token',
        to: 'ayesha@example.com',
        type: 'password_reset',
      }),
    ).resolves.toEqual({ delivery: 'noop' });

    expect(createClient).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalledWith(
      'dev.auth_link',
      expect.objectContaining({ type: 'password_reset' }),
    );
  });
});
