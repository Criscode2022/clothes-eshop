import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  input,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { SANDBOX_BANK } from '../../shop/bank-transfer';
import type { TransferDetails } from '../../shop/bank-transfer';
import { MoneyPipe } from '../../shop/money.pipe';
import { ShopClient } from '../../shop/shop-client';
import { ShopButtonImports } from '../../ui/shop-button';

/**
 * The simulated bank a bank transfer email links to. It shows whom to pay, how much, and the reference,
 * then "sends" the transfer, which marks the order paid. No money moves, and the page says so.
 */
@Component({
  selector: 'app-sandbox-bank',
  imports: [HlmSpinner, MoneyPipe, RouterLink, ShopButtonImports],
  templateUrl: './sandbox-bank.html',
  styleUrl: './sandbox-bank.scss',
})
export class SandboxBank {
  readonly reference = input.required<string>();
  readonly code = input.required<string>();

  private readonly shop = inject(ShopClient);
  private readonly injector = inject(Injector);
  private readonly outcome = viewChild<ElementRef<HTMLElement>>('outcome');

  protected readonly bank = SANDBOX_BANK;
  protected readonly sending = signal(false);
  protected readonly sendError = signal('');
  protected readonly transfer = resource({
    params: () => ({ reference: this.reference(), code: this.code() }),
    loader: ({ params }) => this.shop.transfer(params.reference, params.code),
  });

  protected async send(details: TransferDetails): Promise<void> {
    this.sending.set(true);
    this.sendError.set('');
    try {
      this.transfer.set(await this.shop.sendTransfer(details.reference, this.code()));
      afterNextRender(
        { write: () => this.outcome()?.nativeElement.focus() },
        { injector: this.injector },
      );
    } catch (error) {
      this.sendError.set(
        error instanceof Error ? error.message : 'The transfer did not go through.',
      );
    } finally {
      this.sending.set(false);
    }
  }
}
