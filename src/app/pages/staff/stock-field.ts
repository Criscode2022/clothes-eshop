import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import type { Locale } from '../../i18n/locale';
import { translate } from '../../i18n/translate';
import { TranslatePipe } from '../../i18n/translate.pipe';
import type { Variant } from '../../shop/catalog';
import { ShopClient } from '../../shop/shop-client';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMinus, lucidePlus } from '@ng-icons/lucide';
import { ShopButtonImports } from '../../ui/shop-button';

/** The name a stock control reads out: the piece, then its color and size. */
export function stockControlLabel(
  locale: Locale,
  name: string,
  color: string,
  size: string,
): string {
  return translate(locale, '{name}, {color} {size}', {
    name: translate(locale, name),
    color: translate(locale, color),
    size,
  });
}

/** On-hand stock for one size and color: nudge or type a count, then save it. A save updates the floor everywhere. */
@Component({
  selector: 'app-stock-field',
  imports: [NgIcon, ShopButtonImports, TranslatePipe],
  providers: [provideIcons({ lucideMinus, lucidePlus })],
  template: `
    <div class="stock" role="group" [attr.aria-label]="'On hand, {item}' | t: { item: label() }">
      <button
        hlmBtn
        variant="ghost"
        size="icon-sm"
        type="button"
        [disabled]="draft() <= 0 || saving()"
        [attr.aria-label]="'One fewer {name}' | t: { name: label() }"
        (click)="nudge(-1)"
      >
        <ng-icon name="lucideMinus" />
      </button>
      <input
        class="input stock__count"
        type="number"
        inputmode="numeric"
        min="0"
        step="1"
        [value]="draft()"
        [attr.aria-label]="'On hand, {item}' | t: { item: label() }"
        [attr.aria-invalid]="invalid()"
        (input)="type($event)"
        (keydown.enter)="save()"
      />
      <button
        hlmBtn
        variant="ghost"
        size="icon-sm"
        type="button"
        [disabled]="saving()"
        [attr.aria-label]="'One more {name}' | t: { name: label() }"
        (click)="nudge(1)"
      >
        <ng-icon name="lucidePlus" />
      </button>
      <button
        hlmBtn
        size="sm"
        type="button"
        class="stock__save"
        [variant]="changed() ? 'default' : 'outline'"
        [disabled]="!changed() || invalid() || saving()"
        (click)="save()"
      >
        {{ 'Save' | t }}<span class="sr-only"> {{ label() }}</span>
      </button>
      <span class="stock__status" role="status">{{ status() | t }}</span>
    </div>
  `,
  styles: `
    .stock {
      display: flex;
      gap: 0.25rem;
      align-items: center;
    }

    .stock__count {
      width: 4.5rem;
      min-height: 2.5rem;
      padding-inline: 0.5rem;
      text-align: center;
      font-variant-numeric: tabular-nums;
    }

    .stock__save {
      margin-inline-start: 0.5rem;
    }

    .stock__status {
      min-width: 4rem;
      font-size: var(--text-sm);
      color: var(--color-text-muted);
    }
  `,
})
export class StockField {
  readonly variant = input.required<Variant>();
  /** The size this count is for, read out by every control: "Oxford Cloth Shirt, White S". */
  readonly label = input.required<string>();

  private readonly shop = inject(ShopClient);
  protected readonly draft = linkedSignal(() => this.variant().stock);
  protected readonly changed = computed(() => this.draft() !== this.variant().stock);
  protected readonly invalid = computed(() => !Number.isInteger(this.draft()) || this.draft() < 0);
  protected readonly saving = signal(false);
  protected readonly status = signal('');

  protected nudge(step: number): void {
    this.draft.update((count) => Math.max(0, (Number.isInteger(count) ? count : 0) + step));
    this.status.set('');
  }

  protected type(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.draft.set(value === '' ? Number.NaN : Number(value));
    this.status.set(this.invalid() ? 'Whole numbers only' : '');
  }

  protected async save(): Promise<void> {
    if (!this.changed() || this.invalid()) {
      return;
    }
    this.saving.set(true);
    try {
      await this.shop.setStock(this.variant().id, this.draft());
      this.status.set('Saved');
    } catch (error) {
      this.status.set(error instanceof Error ? error.message : 'Not saved');
    } finally {
      this.saving.set(false);
    }
  }
}
