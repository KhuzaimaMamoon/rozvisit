import { describe, expect, it, jest } from '@jest/globals';
import { createEmailChannel } from '../src/interfaces/channel.email.js';

describe('Resend email channel', () => {
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
        subject: 'Your plan is active',
        text: 'Your Standard plan is active.',
        to: ['ayesha@example.com'],
      }),
    );
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
