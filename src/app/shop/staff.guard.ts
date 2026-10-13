import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { canOpenArea } from './access';
import type { Actor } from './access';
import { ShopClient } from './shop-client';
import { ShopSession } from './shop-session';

/** Lets the person in when `allows` says so, once a reload has brought back their session; otherwise sends them to `elsewhere`. */
function guardFor(allows: (actor: Actor | null) => boolean, elsewhere: string): CanActivateFn {
  return async () => {
    const session = inject(ShopSession);
    const router = inject(Router);
    await inject(ShopClient).resumeSession();
    return allows(session.current()) || router.createUrlTree([elsewhere]);
  };
}

export const deskGuard = guardFor((actor) => canOpenArea('desk', actor), '/not-allowed');
export const ownerGuard = guardFor((actor) => canOpenArea('owner', actor), '/not-allowed');
export const clientGuard = guardFor((actor) => actor?.role === 'client', '/sign-in');
export const signedInGuard = guardFor((actor) => actor !== null, '/sign-in');
