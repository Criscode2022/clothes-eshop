import { Service, computed, signal } from '@angular/core';
import type { Actor } from './access';
import { accountKindOf } from './session-tokens';

@Service()
export class ShopSession {
  private readonly actor = signal<Actor | null>(null);
  private readonly tokenValue = signal('');

  readonly current = this.actor.asReadonly();
  readonly token = this.tokenValue.asReadonly();
  readonly isSignedIn = computed(() => this.actor() !== null);
  /** Floor accounts are the shared demo people; only Neon accounts can be changed or deleted. */
  readonly accountKind = computed(() => (this.actor() ? accountKindOf(this.tokenValue()) : null));

  adopt(actor: Actor, token: string): void {
    this.actor.set(actor);
    this.tokenValue.set(token);
  }

  clear(): void {
    this.actor.set(null);
    this.tokenValue.set('');
  }
}
