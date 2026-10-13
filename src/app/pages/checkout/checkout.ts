import { NgTemplateOutlet } from '@angular/common';
import { Component, ElementRef, Injector, afterNextRender, inject, signal } from '@angular/core';
import { FormField, email, form, minLength, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBanknote,
  lucideChevronDown,
  lucideCircleAlert,
  lucideLandmark,
  lucideStore,
} from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { Bag } from '../../shop/bag';
import { BagDrawer } from '../../shop/bag-drawer';
import { PAYMENT_METHODS } from '../../shop/checkout';
import type { PaymentMethodId } from '../../shop/checkout';
import { MoneyPipe } from '../../shop/money.pipe';
import { ShopClient } from '../../shop/shop-client';
import { ShopSession } from '../../shop/shop-session';
import { FreeShipping } from '../../ui/free-shipping';
import { OrderTotals } from '../../ui/order-totals';
import { PiecePhoto } from '../../ui/piece-photo';
import { ShopButtonImports } from '../../ui/shop-button';
import { TextField } from '../../ui/text-field';

/** The mark beside each way to pay. */
const METHOD_ICONS: Record<PaymentMethodId, string> = {
  'shop-floor': 'lucideStore',
  'bank-transfer': 'lucideLandmark',
  'cash-on-delivery': 'lucideBanknote',
};

/** One page: contact, delivery, and how to pay, with the order's cost in view the whole time. */
@Component({
  selector: 'app-checkout',
  imports: [
    FormField,
    FreeShipping,
    HlmAlertImports,
    HlmCardImports,
    HlmEmptyImports,
    HlmSpinner,
    MoneyPipe,
    NgIcon,
    NgTemplateOutlet,
    OrderTotals,
    PiecePhoto,
    RouterLink,
    ShopButtonImports,
    TextField,
  ],
  providers: [
    provideIcons({
      lucideBanknote,
      lucideChevronDown,
      lucideCircleAlert,
      lucideLandmark,
      lucideStore,
    }),
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly shop = inject(ShopClient);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly bag = inject(Bag);
  protected readonly drawer = inject(BagDrawer);
  protected readonly session = inject(ShopSession);
  protected readonly methods = PAYMENT_METHODS;
  protected readonly methodIcons = METHOD_ICONS;
  protected readonly errorMessage = signal('');
  protected readonly placing = signal(false);
  protected readonly model = signal({
    contact: {
      name: this.session.current()?.name ?? '',
      email: this.session.current()?.email ?? '',
      phone: '',
    },
    shipping: { line1: '', city: '', postalCode: '', country: 'United States' },
    paymentMethod: '',
  });
  protected readonly checkoutForm = form(this.model, (path) => {
    required(path.contact.name, { message: 'Enter the name for the parcel.' });
    minLength(path.contact.name, 2, { message: 'Enter the name for the parcel.' });
    required(path.contact.email, { message: 'Enter an email for the receipt.' });
    email(path.contact.email, { message: 'Enter an email address, like name@example.com.' });
    required(path.contact.phone, { message: 'Enter a phone number.' });
    minLength(path.contact.phone, 7, { message: 'Enter a phone number with at least 7 digits.' });
    required(path.shipping.line1, { message: 'Enter the street address.' });
    minLength(path.shipping.line1, 3, { message: 'Enter the street address.' });
    required(path.shipping.city, { message: 'Enter the city.' });
    minLength(path.shipping.city, 2, { message: 'Enter the city.' });
    required(path.shipping.postalCode, { message: 'Enter the postal code.' });
    minLength(path.shipping.postalCode, 3, { message: 'Enter the postal code.' });
    required(path.shipping.country, { message: 'Enter the country.' });
    minLength(path.shipping.country, 2, { message: 'Enter the country.' });
    required(path.paymentMethod, { message: 'Choose how you will pay.' });
  });

  protected placeOrder(): void {
    this.errorMessage.set('');
    void submit(this.checkoutForm, {
      action: async () => {
        await this.sendOrder();
      },
      onInvalid: () => this.focusFirstProblem(),
    });
  }

  private async sendOrder(): Promise<void> {
    this.placing.set(true);
    try {
      const { contact, shipping, paymentMethod } = this.model();
      const order = await this.shop.placeOrder({
        contact,
        shipping,
        paymentMethod,
        lines: this.bag.items(),
      });
      this.bag.clear();
      await this.router.navigate(['/order', order.reference], { state: { placed: true } });
    } catch (error) {
      // Everything typed stays in the form, so the shopper only fixes what failed and places it again.
      this.errorMessage.set(
        error instanceof Error ? error.message : 'The shop could not place that order.',
      );
      this.focusFirstProblem();
    } finally {
      this.placing.set(false);
    }
  }

  /** Errors render on the next pass; wait for it, then put focus on the first thing to fix. */
  private focusFirstProblem(): void {
    afterNextRender(
      () =>
        this.host.nativeElement
          .querySelector<HTMLElement>('[role="alert"], [aria-invalid="true"]')
          ?.focus(),
      { injector: this.injector },
    );
  }
}
