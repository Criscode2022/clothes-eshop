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
import { FormField, applyWhen, form, required, submit, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBanknote,
  lucideChevronDown,
  lucideCircleAlert,
  lucideLandmark,
  lucideStore,
  lucideTruck,
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
import { DELIVERY_METHODS, paymentFitsDelivery, paymentMethodsFor } from '../../shop/checkout';
import type { DeliveryMethod, PaymentMethodId, ShippingDetails } from '../../shop/checkout';
import { countryNamed } from '../../shop/countries';
import { formatMoney } from '../../shop/money';
import { MoneyPipe } from '../../shop/money.pipe';
import { PICKUP_POINT } from '../../shop/pickup-point';
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

/** The mark beside each way to receive the order. */
const DELIVERY_ICONS: Record<DeliveryMethod, string> = {
  ship: 'lucideTruck',
  pickup: 'lucideStore',
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
      lucideTruck,
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
  protected readonly deliveries = DELIVERY_METHODS;
  protected readonly deliveryIcons = DELIVERY_ICONS;
  protected readonly methodIcons = METHOD_ICONS;
  protected readonly pickupPoint = PICKUP_POINT;
  protected readonly errorMessage = signal('');
  protected readonly placing = signal(false);
  protected readonly model = signal({
    contact: {
      name: this.session.current()?.name ?? '',
      email: this.session.current()?.email ?? '',
      phone: '',
    },
    delivery: 'ship' as DeliveryMethod,
    shipping: { country: 'United States', line1: '', city: '', region: '', postalCode: '' },
    paymentMethod: '',
  });
  /** The rules the server applies too (address-rules), shown as each field is left. */
  protected readonly checkoutForm = form(this.model, (path) => {
    validate(path.contact.name, ({ value }) => problem(nameProblem(value())));
    validate(path.contact.email, ({ value }) => problem(emailProblem(value())));
    validate(path.contact.phone, ({ value }) => problem(phoneProblem(value())));
    // An order picked up at the shop has no address to check.
    applyWhen(
      path.shipping,
      ({ valueOf }) => valueOf(path.delivery) === 'ship',
      (shipping) => {
        validate(shipping.country, ({ value }) => problem(countryProblem(value())));
        validate(shipping.line1, ({ value }) => problem(streetProblem(value())));
        validate(shipping.city, ({ value }) => problem(cityProblem(value())));
        validate(shipping.region, ({ value, valueOf }) =>
          problem(regionProblem(valueOf(shipping.country), value())),
        );
        validate(shipping.postalCode, ({ value, valueOf }) =>
          problem(postalCodeProblem(valueOf(shipping.country), value())),
        );
      },
    );
    required(path.paymentMethod, { message: 'Choose how you will pay.' });
  });
  protected readonly shipping = computed(() => this.model().delivery === 'ship');
  /** What the bag costs reaching the shopper the way they chose. */
  protected readonly quote = computed(() => this.bag.quoteFor(this.model().delivery));
  protected readonly methods = computed(() => paymentMethodsFor(this.model().delivery));
  /** The country picked so far, which decides the region field and the postal format. */
  protected readonly country = computed(() => countryNamed(this.model().shipping.country));
  protected readonly phoneHint = computed(() => {
    if (!this.shipping()) {
      return 'So the shop can reach you about the order. Include the country code.';
    }
    const country = this.country();
    return `For the carrier. Include the country code${country ? `, like ${country.dial}` : ''}.`;
  });

  /** What each way to receive the order costs, as its choice says: shipping, or nothing. */
  protected deliveryCost(delivery: DeliveryMethod): string {
    if (delivery === 'pickup') {
      return 'Free';
    }
    const shipping = this.bag.quoteFor('ship')?.shippingCents ?? 0;
    return shipping === 0 ? 'Free' : formatMoney(shipping);
  }

  /**
   * Picking up opens paying at the shop, and shipping closes it; a way to pay chosen for the other
   * delivery is dropped, so the shopper chooses again from what is offered.
   */
  protected chooseDelivery(delivery: DeliveryMethod): void {
    this.model.update((model) => ({
      ...model,
      delivery,
      paymentMethod: paymentFitsDelivery(model.paymentMethod, delivery) ? model.paymentMethod : '',
    }));
  }

  /**
   * A state or province from the country before means nothing in the new one. The list also reports
   * its country when it comes back after a look at picking up, so a state the country lists stays.
   */
  protected countryChosen(): void {
    this.updateShipping((shipping) => {
      const listed = countryNamed(shipping.country)?.division?.options.includes(shipping.region);
      return listed ? shipping : { ...shipping, region: '' };
    });
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
      const { contact, delivery, shipping, paymentMethod } = this.model();
      const order = await this.shop.placeOrder({
        contact,
        delivery,
        shipping: delivery === 'ship' ? shipping : null,
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
