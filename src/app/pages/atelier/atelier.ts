import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORIES } from '../../shop/catalog';
import { PAYMENT_METHODS } from '../../shop/checkout';

/** How Marlow works: the floor, the cloth, and how an order leaves. */
@Component({
  selector: 'app-atelier',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './atelier.html',
  styleUrl: './atelier.scss',
})
export class Atelier {
  protected readonly categories = CATEGORIES;
  protected readonly paymentMethods = PAYMENT_METHODS;
  protected readonly orderSteps = [
    { name: 'Placed', detail: 'The order is in the book, and its pieces are held off the floor.' },
    { name: 'Picking', detail: 'The workroom is gathering the pieces.' },
    { name: 'Ready', detail: 'The parcel is packed.' },
    { name: 'Completed', detail: 'The order is finished.' },
  ];
}
