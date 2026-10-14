/** Floor accounts are the shared demo people; Neon accounts are real people signed in through Neon Auth. */
export type AccountKind = 'floor' | 'neon';

const KINDS: readonly AccountKind[] = ['floor', 'neon'];

/** A session token starts with the kind of account it opens; the server's signature vouches for it. */
export function accountKindOf(token: string): AccountKind | null {
  return KINDS.find((kind) => token.startsWith(`${kind}_`)) ?? null;
}
