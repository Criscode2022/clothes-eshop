import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Server },
  { path: 'category/:slug', renderMode: RenderMode.Server },
  { path: 'product/:id', renderMode: RenderMode.Server },
  { path: 'atelier', renderMode: RenderMode.Server },
  { path: 'bag', renderMode: RenderMode.Client },
  { path: 'checkout', renderMode: RenderMode.Client },
  { path: 'order/:reference', renderMode: RenderMode.Client },
  { path: 'sign-in', renderMode: RenderMode.Client },
  { path: 'account/orders', renderMode: RenderMode.Client },
  { path: 'desk', renderMode: RenderMode.Client },
  { path: 'owner', renderMode: RenderMode.Client },
  { path: 'not-allowed', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Client },
];
