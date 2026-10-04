import { Service, inject, signal } from '@angular/core';
import { Bag } from './bag';
import type { AddOutcome } from './bag';

/** The bag that slides in over the page. Adding a size opens it on that line. */
@Service()
export class BagDrawer {
  private readonly bag = inject(Bag);
  private readonly openState = signal(false);
  private readonly addedVariant = signal<string | null>(null);

  readonly isOpen = this.openState.asReadonly();
  /** The size just added, so the drawer can point to it. */
  readonly justAdded = this.addedVariant.asReadonly();

  add(productId: string, variantId: string): AddOutcome {
    const outcome = this.bag.add(productId, variantId);
    if (outcome.added) {
      this.addedVariant.set(variantId);
      this.openState.set(true);
    }
    return outcome;
  }

  open(): void {
    this.addedVariant.set(null);
    this.openState.set(true);
  }

  close(): void {
    this.openState.set(false);
    this.addedVariant.set(null);
  }
}
