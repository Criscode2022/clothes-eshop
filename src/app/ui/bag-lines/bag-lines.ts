import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Bag } from '../../shop/bag';
import type { BagLine } from '../../shop/bag';
import { MoneyPipe } from '../../shop/money.pipe';
import { PiecePhoto } from '../piece-photo';
import { QuantityStepper } from '../quantity-stepper';

/** The bag's lines, each with its photo, size, price, and quantity controls. */
@Component({
  selector: 'app-bag-lines',
  imports: [MoneyPipe, PiecePhoto, QuantityStepper, RouterLink],
  templateUrl: './bag-lines.html',
  styleUrl: './bag-lines.scss',
})
export class BagLines {
  readonly lines = input.required<readonly BagLine[]>();
  /** The size just added, marked so the eye finds it. */
  readonly highlight = input<string | null>(null);

  private readonly bag = inject(Bag);

  protected describe(line: BagLine): string {
    return `${line.name}, ${line.color} ${line.size}`;
  }

  protected setQuantity(line: BagLine, quantity: number): void {
    this.bag.setQuantity(line.variantId, quantity);
  }

  protected remove(line: BagLine): void {
    this.bag.remove(line.variantId);
  }
}
