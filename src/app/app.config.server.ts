import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { CATALOG_SOURCE } from './shop/catalog-store';
import { listCatalog } from './shop/order-book';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: CATALOG_SOURCE, useValue: { products: () => listCatalog() } },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
