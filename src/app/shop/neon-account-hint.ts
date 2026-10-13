import { DOCUMENT } from '@angular/common';
import { Service, inject } from '@angular/core';

const NEON_HINT_KEY = 'marlow.neon-account';

/**
 * Remembers that a Neon account signed in from this browser, so a reload knows to ask Neon Auth for it
 * and guests never load the Neon Auth SDK. It holds no secret: Neon Auth's cookie is what proves the session.
 */
@Service()
export class NeonAccountHint {
  private readonly document = inject(DOCUMENT);

  isSet(): boolean {
    return this.attempt((storage) => storage.getItem(NEON_HINT_KEY) === 'yes') ?? false;
  }

  remember(): void {
    this.attempt((storage) => storage.setItem(NEON_HINT_KEY, 'yes'));
  }

  forget(): void {
    this.attempt((storage) => storage.removeItem(NEON_HINT_KEY));
  }

  /** Storage can be missing (the server) or blocked (private windows); then a reload simply signs out. */
  private attempt<T>(use: (storage: Storage) => T): T | null {
    try {
      const storage = this.document.defaultView?.localStorage;
      return storage ? use(storage) : null;
    } catch {
      return null;
    }
  }
}
