import { Service } from '@angular/core';
import type { VanillaBetterAuthClient as AuthClient } from '@neondatabase/auth';
import { NEON_AUTH_URL } from './neon-public';

/** Neon Auth answers `{ error }` instead of throwing; this turns that into an error the page can show. */
function failIfRefused(result: { error?: { message?: string } | null }, fallback: string): void {
  if (result.error) {
    throw new Error(result.error.message || fallback);
  }
}

/**
 * Real accounts in the browser: sign-in, sign-up, and passwords, through Neon Auth.
 * The SDK loads on first use, so the shop bundle does not pay for it up front.
 */
@Service()
export class NeonAuth {
  private client: Promise<AuthClient> | null = null;

  /** Signs in or creates the account, and returns the token the shop server turns into a session. */
  async sessionToken(
    mode: 'sign-in' | 'sign-up',
    email: string,
    password: string,
    name = '',
  ): Promise<string> {
    const auth = await this.auth();
    const result =
      mode === 'sign-in'
        ? await auth.signIn.email({ email, password })
        : await auth.signUp.email({ name, email, password });
    failIfRefused(result, 'That email and password do not match.');
    const token = (await auth.token()).data?.token;
    if (!token) {
      throw new Error('The account session did not start.');
    }
    return token;
  }

  /** The token for the account Neon Auth's cookie still holds from an earlier visit, or null when it holds none. */
  async currentSessionToken(): Promise<string | null> {
    const auth = await this.auth();
    const session = await auth.getSession();
    if (!session.data?.session) {
      return null;
    }
    return (await auth.token()).data?.token ?? null;
  }

  async signOut(): Promise<void> {
    await (await this.auth()).signOut();
  }

  /** Checks the current password by signing in with it, then sets the new one and signs out other devices. */
  async changePassword(email: string, currentPassword: string, newPassword: string): Promise<void> {
    const auth = await this.auth();
    failIfRefused(
      await auth.signIn.email({ email, password: currentPassword }),
      'That is not the current password.',
    );
    failIfRefused(
      await auth.changePassword({ currentPassword, newPassword, revokeOtherSessions: true }),
      'The password could not be changed.',
    );
  }

  /** Neon Auth emails a link that comes back to `redirectTo` with `?token=`. It says nothing about unknown emails. */
  async requestPasswordReset(email: string, redirectTo: string): Promise<void> {
    const auth = await this.auth();
    failIfRefused(
      await auth.requestPasswordReset({ email, redirectTo }),
      'The link could not be sent.',
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const auth = await this.auth();
    failIfRefused(
      await auth.resetPassword({ token, newPassword }),
      'That link has expired or was already used.',
    );
  }

  private auth(): Promise<AuthClient> {
    this.client ??= connect();
    return this.client;
  }
}

async function connect(): Promise<AuthClient> {
  const { createAuthClient } = await import('@neondatabase/auth');
  const client = createAuthClient(NEON_AUTH_URL);
  return client;
}
