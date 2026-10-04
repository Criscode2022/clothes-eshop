import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { Bag } from '../../shop/bag';
import { BagDrawer } from '../../shop/bag-drawer';
import { BagLines } from '../../ui/bag-lines/bag-lines';
import { closeModal, isBackdropClick, openModal } from '../../ui/dialog';
import { FreeShipping } from '../../ui/free-shipping';
import { Icon } from '../../ui/icon';
import { OrderTotals } from '../../ui/order-totals';

/** The bag sliding in from the right edge, over whatever page the shopper is on. */
@Component({
  selector: 'app-bag-panel',
  imports: [BagLines, FreeShipping, Icon, OrderTotals, RouterLink],
  templateUrl: './bag-panel.html',
  styleUrl: './bag-panel.scss',
})
export class BagPanel {
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  protected readonly bag = inject(Bag);
  protected readonly drawer = inject(BagDrawer);
  protected readonly addedLine = computed(
    () => this.bag.detailed().find((line) => line.variantId === this.drawer.justAdded()) ?? null,
  );

  constructor() {
    afterRenderEffect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.drawer.isOpen()) {
        openModal(dialog);
      } else {
        closeModal(dialog);
      }
    });
    // Close before the next page renders, so the dialog hands focus back before the shell moves it to the page.
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.close());
  }

  protected close(): void {
    this.drawer.close();
    closeModal(this.dialog().nativeElement);
  }

  protected closeFromBackdrop(event: MouseEvent): void {
    if (isBackdropClick(event, this.dialog().nativeElement)) {
      this.close();
    }
  }
}
