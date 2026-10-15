import { DestroyRef, Service, inject, signal } from '@angular/core';

const VISIBLE_FOR_MS = 4_000;

/** A short note at the bottom of the shop. It leaves on its own. */
@Service()
export class ShopNotice {
  private readonly message = signal('');
  private hideTimer: ReturnType<typeof setTimeout> | undefined;

  readonly text = this.message.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.hideTimer));
  }

  show(message: string): void {
    this.message.set(message);
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this.dismiss(), VISIBLE_FOR_MS);
  }

  dismiss(): void {
    clearTimeout(this.hideTimer);
    this.hideTimer = undefined;
    this.message.set('');
  }
}
