import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Language } from '../../i18n/language';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { translate } from '../../i18n/translate';
import { Bag } from '../../shop/bag';
import type { BagLine } from '../../shop/bag';
import { MoneyPipe } from '../../shop/money.pipe';
import { PiecePhoto } from '../piece-photo';
import { QuantityStepper } from '../quantity-stepper';
import { ShopButtonImports } from '../shop-button';

/** The bag's lines, each with its photo, size, price, and quantity controls. */
@Component({
  selector: 'app-bag-lines',
  imports: [MoneyPipe, PiecePhoto, QuantityStepper, RouterLink, ShopButtonImports, TranslatePipe],
  templateUrl: './bag-lines.html',
  styleUrl: './bag-lines.scss',
})
export class BagLines {
  readonly lines = input.required<readonly BagLine[]>();
  /** The size just added, marked so the eye finds it. */
  readonly highlight = input<string | null>(null);

  private readonly bag = inject(Bag);
  private readonly language = inject(Language);

  /** The line as the quantity control names it: the piece, then its color and size. */
  protected describe(line: BagLine): string {
    const locale = this.language.locale();
    return translate(locale, '{name}, {color} {size}', {
      name: translate(locale, line.name),
      color: translate(locale, line.color),
      size: line.size,
    });
  }

  protected setQuantity(line: BagLine, quantity: number): void {
    this.bag.setQuantity(line.variantId, quantity);
  }

  protected remove(line: BagLine): void {
    this.bag.remove(line.variantId);
  }
}
