import { NEON_AUTH_URL } from './neon-public';

/** Loads Neon Auth on first use so the shop bundle does not pay for it up front. */
export async function neonAuthToken(
  mode: 'sign-in' | 'sign-up',
  email: string,
  password: string,
  name = '',
): Promise<string> {
  const { createAuthClient } = await import('@neondatabase/auth');
  const auth = createAuthClient(NEON_AUTH_URL);
  const result =
    mode === 'sign-in'
      ? await auth.signIn.email({ email, password })
      : await auth.signUp.email({ name, email, password });
  if (result.error) {
    throw new Error(result.error.message ?? 'That email and password do not match.');
  }
  const token = (await auth.token()).data?.token;
  if (!token) {
    throw new Error('The account session did not start.');
  }
  return token;
}

export async function neonAuthSignOut(): Promise<void> {
  const { createAuthClient } = await import('@neondatabase/auth');
  await createAuthClient(NEON_AUTH_URL).signOut();
}
