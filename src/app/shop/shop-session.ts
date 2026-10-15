import { Service, computed, signal } from '@angular/core';
import type { Actor } from './access';

@Service()
export class ShopSession {
  private readonly actor = signal<Actor | null>(null);
  private readonly tokenValue = signal('');

  readonly current = this.actor.asReadonly();
  readonly token = this.tokenValue.asReadonly();
  readonly isSignedIn = computed(() => this.actor() !== null);

  adopt(actor: Actor, token: string): void {
    this.actor.set(actor);
    this.tokenValue.set(token);
  }

  clear(): void {
    this.actor.set(null);
    this.tokenValue.set('');
  }
}
