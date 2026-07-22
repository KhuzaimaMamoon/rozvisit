import { describe, expect, it, jest } from '@jest/globals';
import { createEmailChannel } from '../src/interfaces/channel.email.js';

describe('Email channel', () => {
  const brevoResponse = (body = { messageId: 'brevo-1' }, status = 201) => ({
    json: jest.fn().mockResolvedValue(body),
    ok: status >= 200 && status < 300,
    status,
  });

  it('uses Gmail SMTP ahead of Brevo when both delivery options are configured', async () => {
    const sendMail = jest.fn().mockResolvedValue({ messageId: 'gmail-1' });
    const createGmailTransport = jest.fn(() => ({ sendMail }));
    const sendRequest = jest.fn();
    const channel = createEmailChannel({
      apiKey: 'brevo-test-key',
      createGmailTransport,
      enableDelivery: true,
      fromAddress: 'noreply@verified-brevo.example',
      gmailAppPassword: 'abcdefghijklmnop',
      gmailSmtpPort: 465,
      gmailUser: 'rozvisit.testing@gmail.com',
      log: { info: jest.fn(), warn: jest.fn() },
      sendRequest,
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
    expect(sendRequest).not.toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'rozvisit.testing@gmail.com',
        to: 'ayesha@example.com',
      }),
    );
  });

  it('falls back to Brevo when configured Gmail SMTP cannot deliver', async () => {
    const sendMail = jest.fn().mockRejectedValue(new Error('SMTP unavailable'));
    const sendRequest = jest.fn().mockResolvedValue(brevoResponse());
    const channel = createEmailChannel({
      apiKey: 'brevo-test-key',
      createGmailTransport: () => ({ sendMail }),
      enableDelivery: true,
      fromAddress: 'noreply@verified-brevo.example',
      gmailAppPassword: 'abcdefghijklmnop',
      gmailUser: 'rozvisit.testing@gmail.com',
      log: { info: jest.fn(), warn: jest.fn() },
      sendRequest,
    });

    await channel.send({ to: 'ayesha@example.com', type: 'password_reset' });

    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendRequest).toHaveBeenCalledTimes(1);
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

  it('uses Brevo without constructing an SMTP transport in production', async () => {
    const createGmailTransport = jest.fn();
    const sendRequest = jest.fn().mockResolvedValue(brevoResponse());
    const channel = createEmailChannel({
      apiKey: 'brevo-test-key',
      createGmailTransport,
      enableDelivery: true,
      fromAddress: 'verified-sender@example.com',
      gmailAppPassword: 'abcdefghijklmnop',
      gmailUser: 'rozvisit.testing@gmail.com',
      log: { info: jest.fn(), warn: jest.fn() },
      nodeEnv: 'production',
      sendRequest,
    });

    await channel.send({ to: 'ayesha@example.com', type: 'email_verification' });

    expect(createGmailTransport).not.toHaveBeenCalled();
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('preserves safe Brevo rejection details for the retry logger', async () => {
    const sendRequest = jest
      .fn()
      .mockResolvedValue(
        brevoResponse(
          { code: 'unauthorized', message: 'Key not found', name: 'unauthorized' },
          401,
        ),
      );
    const channel = createEmailChannel({
      apiKey: 'brevo-test-key',
      enableDelivery: true,
      fromAddress: 'verified-sender@example.com',
      log: { info: jest.fn(), warn: jest.fn() },
      nodeEnv: 'production',
      sendRequest,
    });

    await expect(
      channel.send({ to: 'ayesha@example.com', type: 'email_verification' }),
    ).rejects.toMatchObject({
      code: 'unauthorized',
      message: 'Brevo email delivery failed: Key not found',
      responseCode: 401,
      statusCode: 401,
      providerDetails: {
        code: 'unauthorized',
        message: 'Key not found',
        name: 'unauthorized',
        statusCode: 401,
      },
    });
  });

  it('delivers a Brevo email when a dedicated API key is configured', async () => {
    const log = { info: jest.fn(), warn: jest.fn() };
    const sendRequest = jest.fn().mockResolvedValue(brevoResponse({ messageId: 'email-1' }));
    const channel = createEmailChannel({
      apiKey: 'brevo-test-key',
      enableDelivery: true,
      fromAddress: 'noreply@example.com',
      log,
      nodeEnv: 'production',
      sendRequest,
    });

    await channel.send({
      body: 'Your Standard plan is active.',
      title: 'Your plan is active',
      to: 'ayesha@example.com',
      type: 'subscription_active',
    });

    expect(sendRequest).toHaveBeenCalledWith(
      'https://api.brevo.com/v3/smtp/email',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'api-key': 'brevo-test-key' }),
      }),
    );
    const payload = JSON.parse(sendRequest.mock.calls[0][1].body);
    expect(payload).toMatchObject({
      sender: { email: 'noreply@example.com', name: 'RozVisit' },
      subject: 'Your plan is active',
      textContent: 'Your Standard plan is active.',
      to: [{ email: 'ayesha@example.com' }],
    });
    expect(payload.htmlContent).toContain('Your Standard plan is active.');
    expect(log.info).toHaveBeenCalledWith('notification.email_sent', {
      delivery: 'brevo',
      provider: 'brevo',
      type: 'subscription_active',
    });
  });

  it('uses no-op delivery without a Brevo key while retaining the development auth-link log', async () => {
    const log = { info: jest.fn(), warn: jest.fn() };
    const sendRequest = jest.fn();
    const channel = createEmailChannel({
      apiKey: null,
      devLogAuthLinks: true,
      log,
      sendRequest,
    });

    await expect(
      channel.send({
        link: 'http://localhost:5173/reset?token=single-use-token',
        to: 'ayesha@example.com',
        type: 'password_reset',
      }),
    ).resolves.toEqual({ delivery: 'noop' });

    expect(sendRequest).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalledWith(
      'dev.auth_link',
      expect.objectContaining({ type: 'password_reset' }),
    );
  });
});
