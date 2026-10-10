import { Component, computed, input } from '@angular/core';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { fulfillmentName } from '../shop/checkout';
import type { Fulfillment } from '../shop/checkout';

/** An order's state as a colored dot and its name. The name always carries the meaning; the dot only helps scanning. */
@Component({
  selector: 'app-fulfillment-badge',
  imports: [HlmBadge],
  host: { '[attr.data-state]': 'state()' },
  template: `<span hlmBadge variant="outline" class="status"
    ><span class="status__dot" aria-hidden="true"></span>{{ name() }}</span
  >`,
  styles: `
    :host {
      display: inline-flex;
    }

    .status {
      gap: 0.5rem;
      height: 1.75rem;
      padding-inline: 0.625rem;
      font-size: var(--text-sm);
      font-weight: 400;
      font-stretch: 100%;
    }

    .status__dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: var(--color-text-muted);
    }

    :host([data-state='placed']) .status__dot {
      background: var(--color-text);
    }

    :host([data-state='picking']) .status__dot,
    :host([data-state='ready']) .status__dot {
      background: var(--color-notice);
    }

    :host([data-state='completed']) .status__dot {
      background: var(--color-positive);
    }

    :host([data-state='cancelled']) .status__dot {
      background: var(--color-danger);
    }
  `,
})
export class FulfillmentBadge {
  readonly state = input.required<Fulfillment>();

  protected readonly name = computed(() => fulfillmentName(this.state()));
}
