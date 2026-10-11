import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Email } from './shop-emails';

/** Delivers an email. The shop's code never knows which provider is underneath. */
export interface Mailer {
  /** Names where mail goes, for the server log. Never includes a secret. */
  readonly description: string;
  send(email: Email): Promise<void>;
}

type Env = Readonly<Record<string, string | undefined>>;

export interface GmailSettings {
  readonly transport: {
    readonly host: string;
    readonly port: number;
    readonly secure: boolean;
    readonly auth: { readonly user: string; readonly pass: string };
  };
  readonly from: string;
}

/**
 * Gmail with an app password (Google account, Security, App passwords), read from the server's environment.
 * Google shows the password in groups of four; the spaces are not part of it.
 */
export function gmailSettings(env: Env): GmailSettings | null {
  const user = env['GMAIL_USER']?.trim();
  const pass = env['GMAIL_APP_PASSWORD']?.replace(/\s+/g, '');
  if (!user || !pass) {
    return null;
  }
  return {
    transport: { host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass } },
    from: env['MAIL_FROM']?.trim() || `Marlow <${user}>`,
  };
}

/** Gmail when the server has an account to send from; otherwise a folder of HTML files under tmp/. */
export function mailerFromEnv(env: Env = process.env): Mailer {
  const gmail = gmailSettings(env);
  if (gmail) {
    return gmailMailer(gmail);
  }
  return outboxMailer(env['MAIL_OUTBOX'] || join(process.cwd(), 'tmp', 'mail-outbox'));
}

function gmailMailer(settings: GmailSettings): Mailer {
  let transporter: Promise<{ sendMail(message: object): Promise<unknown> }> | null = null;
  const connect = async () => {
    const { createTransport } = await import('nodemailer');
    return createTransport(settings.transport);
  };
  return {
    description: `Gmail SMTP as ${settings.transport.auth.user}`,
    async send(email) {
      transporter ??= connect();
      await (
        await transporter
      ).sendMail({
        from: settings.from,
        to: email.to,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });
    },
  };
}

function outboxMailer(folder: string): Mailer {
  return {
    description: `Outbox at ${folder}`,
    async send(email) {
      await mkdir(folder, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const slug = email.subject
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60);
      const header = `<!--\nTo: ${email.to}\nSubject: ${email.subject}\n-->\n`;
      await writeFile(join(folder, `${stamp}-${slug}.html`), header + email.html, 'utf8');
    },
  };
}
