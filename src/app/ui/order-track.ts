import { Component, computed, input } from '@angular/core';
import { fulfillmentTrack } from '../shop/checkout';
import type { Fulfillment } from '../shop/checkout';

/** Where an order is on its way from placed to completed. */
@Component({
  selector: 'app-order-track',
  template: `
    @if (steps().length > 0) {
      <ol class="track" aria-label="Order progress">
        @for (step of steps(); track step.state; let index = $index) {
          <li
            [style.--i]="index"
            class="track__step"
            [class.track__step--done]="step.status === 'done'"
            [class.track__step--current]="step.status === 'current'"
            [attr.aria-current]="step.status === 'current' ? 'step' : null"
          >
            <span class="track__mark" aria-hidden="true"></span>
            <span class="track__label">{{ step.label }}</span>
            @if (step.status === 'done') {
              <span class="sr-only">, done</span>
            }
          </li>
        }
      </ol>
    } @else {
      <p class="text-ui">This order was cancelled. Nothing will be shipped.</p>
    }
  `,
  styles: `
    .track {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: var(--text-sm);
    }

    .track__step {
      display: grid;
      gap: 0.625rem;
      color: var(--color-text-muted);
    }

    .track__mark {
      position: relative;
      height: 2px;
      overflow: hidden;
      background: var(--color-border);

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: var(--color-text);
        transform: scaleX(0);
        transform-origin: left;
      }
    }

    .track__step--done,
    .track__step--current {
      color: var(--color-text);

      .track__mark::after {
        transform: none;
        animation: fill-x var(--duration-slow) var(--ease-out) both;
        animation-delay: calc(var(--i, 0) * 220ms + 200ms);
      }
    }

    .track__step--current .track__label {
      font-weight: 600;
    }
  `,
})
export class OrderTrack {
  readonly state = input.required<Fulfillment>();

  protected readonly steps = computed(() => fulfillmentTrack(this.state()));
}
