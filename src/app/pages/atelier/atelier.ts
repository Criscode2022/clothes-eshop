import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { CATEGORIES } from '../../shop/catalog';
import { PAYMENT_METHODS } from '../../shop/checkout';
import type { PaymentMethodId } from '../../shop/checkout';
import { portraitOf } from '../../shop/cloth';
import { fulfillmentName } from '../../shop/fulfillment';
import { PICKUP_POINT } from '../../shop/pickup-point';
import { Reveal } from '../../ui/reveal';

/** The orders a way to pay is for, where it is not for every order. */
const PAYMENT_FITS: Record<PaymentMethodId, string> = {
  'shop-floor': 'for an order you pick up',
  'bank-transfer': '',
  'cash-on-delivery': 'for an order shipped to you',
};

/** How Marlow works: the floor, the cloth, and how an order leaves. */
@Component({
  selector: 'app-atelier',
  imports: [NgOptimizedImage, Reveal, RouterLink, TranslatePipe],
  templateUrl: './atelier.html',
  styleUrl: './atelier.scss',
})
export class Atelier {
  protected readonly categories = CATEGORIES;
  protected readonly leadPortrait = portraitOf('wool-overcoat');
  protected readonly pickupPoint = PICKUP_POINT;
  protected readonly paymentMethods = PAYMENT_METHODS.map((method) => ({
    id: method.id,
    label: method.label,
    fit: PAYMENT_FITS[method.id],
  }));
  protected readonly orderSteps = [
    {
      name: fulfillmentName('placed'),
      detail: 'The order is in the book, and its pieces are held off the floor.',
    },
    {
      name: fulfillmentName('preparing'),
      detail: 'The workroom gathers the pieces and packs them, or sets them aside at the counter.',
    },
    {
      name: `${fulfillmentName('shipped')}, or ${fulfillmentName('ready').toLowerCase()}`,
      detail:
        'The parcel leaves with the carrier, or the order waits at the counter. Either way, an email says so.',
    },
    {
      name: `${fulfillmentName('delivered')}, or ${fulfillmentName('picked-up').toLowerCase()}`,
      detail: 'The pieces are with you.',
    },
  ];
}
