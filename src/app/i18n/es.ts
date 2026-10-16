import { CATALOG } from './parts/catalog';
import { CHROME } from './parts/chrome';
import { DOMAIN } from './parts/domain';
import { SHOP } from './parts/shop';
import { STAFF } from './parts/staff';

/** Spanish for every English sentence the shop shows. Domain wins when a sentence is shared. */
export const SPANISH: Readonly<Record<string, string>> = {
  ...CHROME,
  ...CATALOG,
  ...SHOP,
  ...STAFF,
  ...DOMAIN,
};
