import { Routes } from '@angular/router';
import { Shell } from './layout/shell';
import { clientGuard, deskGuard, ownerGuard } from './shop/staff.guard';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      {
        path: '',
        title: 'Shop | Marlow',
        loadComponent: () => import('./pages/catalog/catalog').then((m) => m.Catalog),
      },
      {
        path: 'category/:slug',
        title: 'Category | Marlow',
        loadComponent: () => import('./pages/catalog/catalog').then((m) => m.Catalog),
      },
      {
        path: 'product/:id',
        title: 'Piece | Marlow',
        loadComponent: () => import('./pages/product/product').then((m) => m.ProductPage),
      },
      {
        path: 'atelier',
        title: 'Atelier | Marlow',
        loadComponent: () => import('./pages/atelier/atelier').then((m) => m.Atelier),
      },
      {
        path: 'bag',
        title: 'Bag | Marlow',
        loadComponent: () => import('./pages/bag/bag').then((m) => m.BagPage),
      },
      {
        path: 'checkout',
        title: 'Checkout | Marlow',
        loadComponent: () => import('./pages/checkout/checkout').then((m) => m.Checkout),
      },
      {
        path: 'order/:reference',
        title: 'Order | Marlow',
        loadComponent: () => import('./pages/order/order').then((m) => m.OrderPage),
      },
      {
        path: 'sign-in',
        title: 'Sign in | Marlow',
        loadComponent: () => import('./pages/sign-in/sign-in').then((m) => m.SignIn),
      },
      {
        path: 'account/orders',
        title: 'Your orders | Marlow',
        canActivate: [clientGuard],
        loadComponent: () => import('./pages/account/account-orders').then((m) => m.AccountOrders),
      },
      {
        path: 'desk',
        title: 'Desk | Marlow',
        canActivate: [deskGuard],
        loadComponent: () => import('./pages/desk/desk').then((m) => m.Desk),
      },
      {
        path: 'owner',
        title: 'Backoffice | Marlow',
        canActivate: [ownerGuard],
        loadComponent: () => import('./pages/owner/owner').then((m) => m.Owner),
      },
      {
        path: 'not-allowed',
        title: 'Closed | Marlow',
        loadComponent: () => import('./pages/not-allowed/not-allowed').then((m) => m.NotAllowed),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
