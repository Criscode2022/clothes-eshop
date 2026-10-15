import { DOCUMENT } from '@angular/common';
import { Service, inject } from '@angular/core';

const SESSION_KEY = 'marlow.session';

/**
 * Keeps this browser's shop session across reloads. The token is signed by the shop's server, which
 * checks it again on every request. Only a browser that saved one asks Neon Auth once it runs out, so
 * guests never load the Neon Auth SDK.
 */
@Service()
export class SavedSession {
  private readonly document = inject(DOCUMENT);

  token(): string | null {
    return this.attempt((storage) => storage.getItem(SESSION_KEY));
  }

  save(token: string): void {
    this.attempt((storage) => storage.setItem(SESSION_KEY, token));
  }

  forget(): void {
    this.attempt((storage) => storage.removeItem(SESSION_KEY));
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
