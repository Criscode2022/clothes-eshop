import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gmailSettings, mailerFromEnv } from './mailer';

const EMAIL = {
  to: 'ada@example.com',
  subject: 'Your Marlow order MR-1001',
  text: 'Thank you, Ada.',
  html: '<p>Thank you, Ada.</p>',
};

describe('mailer', () => {
  let outbox: string;

  beforeEach(() => {
    outbox = mkdtempSync(join(tmpdir(), 'marlow-outbox-'));
  });

  afterEach(() => rmSync(outbox, { recursive: true, force: true }));

  it('sends through Gmail with an app password, never naming the password', () => {
    const mailer = mailerFromEnv({
      GMAIL_USER: 'shop@gmail.com',
      GMAIL_APP_PASSWORD: 'abcd efgh ijkl mnop',
    });

    expect(mailer.description).toBe('Gmail SMTP as shop@gmail.com');
    expect(mailer.description).not.toContain('abcd');
  });

  it('connects to Gmail over TLS, with the app password run together and the shop as sender', () => {
    expect(
      gmailSettings({ GMAIL_USER: 'shop@gmail.com', GMAIL_APP_PASSWORD: 'abcd efgh ijkl mnop' }),
    ).toEqual({
      transport: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: 'shop@gmail.com', pass: 'abcdefghijklmnop' },
      },
      from: 'Marlow <shop@gmail.com>',
    });
    expect(
      gmailSettings({
        GMAIL_USER: 'shop@gmail.com',
        GMAIL_APP_PASSWORD: 'abcdefghijklmnop',
        MAIL_FROM: 'Marlow Atelier <shop@gmail.com>',
      })?.from,
    ).toBe('Marlow Atelier <shop@gmail.com>');
    expect(gmailSettings({ GMAIL_USER: 'shop@gmail.com' })).toBeNull();
  });

  it('keeps emails in a local outbox when no Gmail account is set, so development can read them', async () => {
    const mailer = mailerFromEnv({ MAIL_OUTBOX: outbox });

    await mailer.send(EMAIL);

    expect(mailer.description).toBe(`Outbox at ${outbox}`);
    const files = readdirSync(outbox);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/your-marlow-order-mr-1001\.html$/);
    const saved = readFileSync(join(outbox, files[0] ?? ''), 'utf8');
    expect(saved).toContain('To: ada@example.com');
    expect(saved).toContain('<p>Thank you, Ada.</p>');
  });
});
