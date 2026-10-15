import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideNgIconsConfig } from '@ng-icons/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withNavigationErrorHandler,
  withViewTransitions,
} from '@angular/router';
import { routes } from './app.routes';
import { reloadStaleBuild } from './stale-build';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      // A new page starts at its top; Back returns to where the shopper was on the floor.
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      // A piece's photograph carries over from the floor to its page. The first render keeps the server's HTML still.
      withViewTransitions({ skipInitialTransition: true }),
      // A tab opened before a deploy asks for the old build's page scripts; a full load brings the new build.
      withNavigationErrorHandler(reloadStaleBuild),
    ),
    provideHttpClient(withFetch()),
    provideClientHydration(),
    // Lucide at the shop's own line weight, so Spartan's icons and ours read as one set.
    provideNgIconsConfig({ strokeWidth: 1.5 }),
  ],
};
