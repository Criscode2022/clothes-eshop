import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { canOpenArea } from './access';
import type { StaffArea } from './access';
import { ShopSession } from './shop-session';

function staffGuard(area: StaffArea): CanActivateFn {
  return () => canOpenArea(area, inject(ShopSession).current()) || inject(Router).createUrlTree(['/not-allowed']);
}

export const deskGuard: CanActivateFn = staffGuard('desk');
export const ownerGuard: CanActivateFn = staffGuard('owner');

export const clientGuard: CanActivateFn = () =>
  inject(ShopSession).current()?.role === 'client' || inject(Router).createUrlTree(['/sign-in']);
