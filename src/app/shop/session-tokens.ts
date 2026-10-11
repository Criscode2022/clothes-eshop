/** Floor accounts are the shared demo people; Neon accounts are real people signed in through Neon Auth. */
export type AccountKind = 'floor' | 'neon';

const KINDS: readonly AccountKind[] = ['floor', 'neon'];

/** A session token nobody can guess. Its prefix only says which kind of account it opens. */
export function newSessionToken(kind: AccountKind): string {
  return `${kind}_${globalThis.crypto.randomUUID()}`;
}

export function accountKindOf(token: string): AccountKind | null {
  return KINDS.find((kind) => token.startsWith(`${kind}_`)) ?? null;
}
