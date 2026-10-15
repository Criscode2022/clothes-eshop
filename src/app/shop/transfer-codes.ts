import { createHmac, timingSafeEqual } from 'node:crypto';
import { serverKey } from './server-key';

/**
 * Signs the link a bank transfer email carries, so only that email can pay that order: references run
 * in sequence, and anyone could guess the next one.
 */
export class TransferCodes {
  constructor(private readonly key: Uint8Array) {}

  codeFor(reference: string): string {
    return createHmac('sha256', this.key).update(`transfer:${reference}`).digest('base64url');
  }

  matches(reference: string, code: string): boolean {
    const expected = Buffer.from(this.codeFor(reference));
    const given = Buffer.from(code);
    return expected.length === given.length && timingSafeEqual(expected, given);
  }
}

export function transferKeyFrom(secret: string | undefined): Uint8Array {
  return serverKey(secret, 'marlow bank transfers');
}
