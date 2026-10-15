import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormField, form, required, submit, validate } from '@angular/forms/signals';
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
import {
  cityProblem,
  countryProblem,
  emailProblem,
  nameProblem,
  normalizedPostalCode,
  phoneProblem,
  postalCodeProblem,
  regionProblem,
  streetProblem,
} from '../../shop/address-rules';
import { Bag } from '../../shop/bag';
import { BagDrawer } from '../../shop/bag-drawer';
import { PAYMENT_METHODS } from '../../shop/checkout';
import { countryNamed } from '../../shop/countries';
import type { PaymentMethodId, ShippingDetails } from '../../shop/checkout';
import { MoneyPipe } from '../../shop/money.pipe';
import { ShopClient } from '../../shop/shop-client';
import { ShopSession } from '../../shop/shop-session';
import { CountryField } from '../../ui/country-field';
import { FreeShipping } from '../../ui/free-shipping';
import { OrderTotals } from '../../ui/order-totals';
import { PiecePhoto } from '../../ui/piece-photo';
import { SelectField } from '../../ui/select-field';
import { ShopButtonImports } from '../../ui/shop-button';
import { TextField } from '../../ui/text-field';

/** The mark beside each way to pay. */
const METHOD_ICONS: Record<PaymentMethodId, string> = {
  'shop-floor': 'lucideStore',
  'bank-transfer': 'lucideLandmark',
  'cash-on-delivery': 'lucideBanknote',
};

/** A rule's message as a form error; no message, no error. */
function problem(message: string | null): { kind: 'rule'; message: string } | null {
  return message ? { kind: 'rule', message } : null;
}

/** One page: contact, delivery, and how to pay, with the order's cost in view the whole time. */
@Component({
  selector: 'app-checkout',
  imports: [
    CountryField,
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
    SelectField,
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
    shipping: { country: 'United States', line1: '', city: '', region: '', postalCode: '' },
    paymentMethod: '',
  });
  /** The rules the server applies too (address-rules), shown as each field is left. */
  protected readonly checkoutForm = form(this.model, (path) => {
    validate(path.contact.name, ({ value }) => problem(nameProblem(value())));
    validate(path.contact.email, ({ value }) => problem(emailProblem(value())));
    validate(path.contact.phone, ({ value }) => problem(phoneProblem(value())));
    validate(path.shipping.country, ({ value }) => problem(countryProblem(value())));
    validate(path.shipping.line1, ({ value }) => problem(streetProblem(value())));
    validate(path.shipping.city, ({ value }) => problem(cityProblem(value())));
    validate(path.shipping.region, ({ value, valueOf }) =>
      problem(regionProblem(valueOf(path.shipping.country), value())),
    );
    validate(path.shipping.postalCode, ({ value, valueOf }) =>
      problem(postalCodeProblem(valueOf(path.shipping.country), value())),
    );
    required(path.paymentMethod, { message: 'Choose how you will pay.' });
  });
  /** The country picked so far, which decides the region field and the postal format. */
  protected readonly country = computed(() => countryNamed(this.model().shipping.country));
  protected readonly phoneHint = computed(() => {
    const country = this.country();
    return `For the carrier. Include the country code${country ? `, like ${country.dial}` : ''}.`;
  });

  /** A state or province from the country before means nothing in the new one. */
  protected countryChosen(): void {
    this.updateShipping((shipping) => ({ ...shipping, region: '' }));
  }

  /** As the person leaves the field, a code that fits is written the country's way: k1a0b1 becomes K1A 0B1. */
  protected tidyPostalCode(): void {
    this.updateShipping((shipping) => ({
      ...shipping,
      postalCode: normalizedPostalCode(shipping.country, shipping.postalCode),
    }));
  }

  protected placeOrder(): void {
    this.errorMessage.set('');
    void submit(this.checkoutForm, {
      action: async () => {
        await this.sendOrder();
      },
      onInvalid: () => this.focusFirstProblem(),
    });
  }

  private updateShipping(change: (shipping: ShippingDetails) => ShippingDetails): void {
    this.model.update((model) => ({ ...model, shipping: change(model.shipping) }));
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
