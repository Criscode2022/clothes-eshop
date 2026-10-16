import { Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMinus, lucidePlus } from '@ng-icons/lucide';
import { TranslatePipe } from '../i18n/translate.pipe';

/** One fewer, the count, one more. The parent decides what a change means. */
@Component({
  selector: 'app-quantity-stepper',
  imports: [NgIcon, TranslatePipe],
  providers: [provideIcons({ lucideMinus, lucidePlus })],
  template: `
    <div class="stepper" role="group" [attr.aria-label]="'Quantity of {name}' | t: { name: (label() | t) }">
      <button
        type="button"
        class="stepper__step"
        [disabled]="value() <= min()"
        [attr.aria-label]="'One fewer {name}' | t: { name: (label() | t) }"
        (click)="changed.emit(value() - 1)"
      >
        <ng-icon name="lucideMinus" />
      </button>
      <output class="stepper__value" aria-live="polite">{{ value() }}</output>
      <button
        type="button"
        class="stepper__step"
        [disabled]="value() >= max()"
        [attr.aria-label]="'One more {name}' | t: { name: (label() | t) }"
        (click)="changed.emit(value() + 1)"
      >
        <ng-icon name="lucidePlus" />
      </button>
    </div>
  `,
  styles: `
    .stepper {
      display: inline-grid;
      grid-template-columns: 2.5rem 2rem 2.5rem;
      align-items: stretch;
      height: 2.5rem;
      font-size: 1rem;
      border: 1px solid var(--color-border);
      transition: border-color var(--duration-fast) ease-out;

      &:hover {
        border-color: var(--color-field-border);
      }
    }

    .stepper__step {
      display: grid;
      place-items: center;
      padding: 0;
      color: inherit;
      background: none;
      border: 0;
      cursor: pointer;

      transition: background-color var(--duration-fast) ease-out;

      &:hover:not(:disabled) {
        background: var(--color-hover);
      }

      &:active:not(:disabled) ng-icon {
        transform: scale(0.85);
      }

      &:disabled {
        color: var(--color-text-muted);
        cursor: not-allowed;
      }
    }

    .stepper__value {
      display: grid;
      place-items: center;
      font-size: var(--text-ui);
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class QuantityStepper {
  readonly value = input.required<number>();
  readonly max = input.required<number>();
  readonly min = input(1);
  /** What is being counted, read out by the buttons: "One more Oxford Cloth Shirt, White S". */
  readonly label = input.required<string>();
  readonly changed = output<number>();
}
