import { Routes } from '@angular/router';
import { Shell } from './layout/shell';
import { clientGuard, deskGuard, ownerGuard, signedInGuard } from './shop/staff.guard';

const orderQueue = () => import('./pages/staff/order-queue').then((m) => m.OrderQueue);

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
        path: 'forgot-password',
        title: 'Forgot your password | Marlow',
        loadComponent: () =>
          import('./pages/password/forgot-password').then((m) => m.ForgotPassword),
      },
      {
        path: 'reset-password',
        title: 'New password | Marlow',
        loadComponent: () => import('./pages/password/reset-password').then((m) => m.ResetPassword),
      },
      {
        path: 'account',
        title: 'Your account | Marlow',
        canActivate: [signedInGuard],
        loadComponent: () => import('./pages/account/account').then((m) => m.AccountPage),
      },
      {
        path: 'account/orders',
        title: 'Your orders | Marlow',
        canActivate: [clientGuard],
        loadComponent: () => import('./pages/account/account-orders').then((m) => m.AccountOrders),
      },
      {
        path: 'desk',
        canActivate: [deskGuard],
        loadComponent: () => import('./pages/desk/desk').then((m) => m.Desk),
        children: [
          {
            path: '',
            title: 'Desk | Marlow',
            data: { heading: 'Orders' },
            loadComponent: orderQueue,
          },
          {
            path: 'stock',
            title: 'Stock | Marlow',
            loadComponent: () => import('./pages/desk/desk-stock').then((m) => m.DeskStock),
          },
        ],
      },
      {
        path: 'owner',
        canActivate: [ownerGuard],
        loadComponent: () => import('./pages/owner/owner').then((m) => m.Owner),
        children: [
          {
            path: '',
            title: 'Backoffice | Marlow',
            data: { heading: 'Every order' },
            loadComponent: orderQueue,
          },
          {
            path: 'pieces',
            title: 'Pieces | Marlow',
            loadComponent: () => import('./pages/owner/owner-pieces').then((m) => m.OwnerPieces),
          },
          {
            path: 'new',
            title: 'New piece | Marlow',
            loadComponent: () => import('./pages/owner/new-piece').then((m) => m.NewPiece),
          },
        ],
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
