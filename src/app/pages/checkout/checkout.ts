import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormField, email, form, minLength, required, submit } from '@angular/forms/signals';
import { Bag } from '../../shop/bag';
import { ShopRuleError } from '../../shop/cart';
import { CatalogStore } from '../../shop/catalog-store';
import { CHECKOUT_STEPS, PAYMENT_METHODS, paymentLabel, quoteOrder } from '../../shop/checkout';
import type { CheckoutStep } from '../../shop/checkout';
import { centsUntilFreeShipping } from '../../shop/money';
import { MoneyPipe } from '../../shop/money.pipe';
import { ShopClient } from '../../shop/shop-client';

@Component({
  selector: 'app-checkout',
  imports: [FormField, MoneyPipe, RouterLink],
  templateUrl: './checkout.html',
})
export class Checkout {
  private readonly bag = inject(Bag);
  private readonly catalog = inject(CatalogStore);
  private readonly shop = inject(ShopClient);
  private readonly router = inject(Router);

  protected readonly steps = CHECKOUT_STEPS;
  protected readonly centsUntilFreeShipping = centsUntilFreeShipping;
  protected readonly methods = PAYMENT_METHODS;
  protected readonly paymentLabel = paymentLabel;
  protected readonly step = signal<CheckoutStep>('contact');
  protected readonly errorMessage = signal('');
  protected readonly placing = signal(false);
  protected readonly contactModel = signal({ name: '', email: '', phone: '' });
  protected readonly shippingModel = signal({
    line1: '',
    city: '',
    postalCode: '',
    country: 'United States',
  });
  protected readonly paymentModel = signal({ method: '' });
  protected readonly contactForm = form(this.contactModel, (path) => {
    required(path.name, { message: 'Enter the name for the parcel.' });
    minLength(path.name, 2, { message: 'Enter the name for the parcel.' });
    required(path.email, { message: 'Enter an email for the receipt.' });
    email(path.email, { message: 'Enter an email for the receipt.' });
    required(path.phone, { message: 'Enter a phone number.' });
    minLength(path.phone, 7, { message: 'Enter a phone number.' });
  });
  protected readonly shippingForm = form(this.shippingModel, (path) => {
    required(path.line1, { message: 'Enter the street.' });
    minLength(path.line1, 3, { message: 'Enter the street.' });
    required(path.city, { message: 'Enter the city.' });
    minLength(path.city, 2, { message: 'Enter the city.' });
    required(path.postalCode, { message: 'Enter the postal code.' });
    minLength(path.postalCode, 3, { message: 'Enter the postal code.' });
    required(path.country, { message: 'Enter the country.' });
    minLength(path.country, 2, { message: 'Enter the country.' });
  });
  protected readonly paymentForm = form(this.paymentModel, (path) => {
    required(path.method, { message: 'Choose how you will pay.' });
  });
  protected readonly quote = computed(() => {
    const lines = this.bag.items();
    if (lines.length === 0) {
      return null;
    }
    try {
      return quoteOrder(lines, this.catalog.pieces());
    } catch (error) {
      return error instanceof ShopRuleError || error instanceof Error ? null : null;
    }
  });

  protected continueContact(): void {
    submit(this.contactForm, async () => {
      this.step.set('shipping');
    });
  }

  protected continueShipping(): void {
    submit(this.shippingForm, async () => {
      this.step.set('review');
    });
  }

  protected continueReview(): void {
    this.step.set('payment');
  }

  protected placeOrder(): void {
    submit(this.paymentForm, async () => {
      this.errorMessage.set('');
      this.placing.set(true);
      try {
        const order = await this.shop.placeOrder({
          contact: this.contactModel(),
          shipping: this.shippingModel(),
          paymentMethod: this.paymentModel().method,
          lines: this.bag.items(),
        });
        this.bag.clear();
        await this.router.navigate(['/order', order.reference]);
      } catch (error) {
        this.errorMessage.set(error instanceof Error ? error.message : 'The shop could not place that order.');
      } finally {
        this.placing.set(false);
      }
    });
  }
}
