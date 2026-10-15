import { ShopRuleError } from './cart';
import type { CheckoutDraft, ContactDetails, ShippingDetails } from './checkout';
import { countryNamed } from './countries';
import type { Country } from './countries';

/**
 * The checkout's rules, shared by the form, which shows them as you leave each field, and the server,
 * which refuses an order that breaks one. Each returns what to fix, in words, or null when it is fine.
 */

/** Letters in any script, with the marks, spaces, apostrophes, periods, and hyphens names use. */
const WORDS = /^[\p{L}\p{M}][\p{L}\p{M}\s'’.-]*$/u;
const LETTERS = /\p{L}/gu;
/** No spaces or quoting, no dot at either end or twice in a row; the domain ends in a real top level. */
const EMAIL =
  /^[^\s@."(),:;<>[\]\\]+(?:\.[^\s@."(),:;<>[\]\\]+)*@(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?\.)+\p{L}{2,}$/u;
const PHONE = /^\+?[\d\s().-]+$/;
const PHONE_DIGITS = { min: 7, max: 15 } as const;
const NAME_MAX = 80;
const STREET = { min: 5, max: 100 } as const;
const CITY_MAX = 60;

export function nameProblem(value: string): string | null {
  const name = value.trim();
  if (name.length < 2) {
    return 'Enter your full name.';
  }
  if (name.length > NAME_MAX) {
    return `Keep the name under ${NAME_MAX} characters.`;
  }
  if (!WORDS.test(name)) {
    return 'Use letters for the name.';
  }
  return (name.match(LETTERS)?.length ?? 0) < 2 ? 'Enter your full name.' : null;
}

export function emailProblem(value: string): string | null {
  const email = value.trim();
  if (!email) {
    return 'Enter an email for the receipt.';
  }
  return email.length <= 254 && EMAIL.test(email)
    ? null
    : 'Enter an email address, like name@example.com.';
}

export function phoneProblem(value: string): string | null {
  const phone = value.trim();
  if (!phone) {
    return 'Enter a phone number.';
  }
  if (!PHONE.test(phone)) {
    return 'Use digits for the phone number, with + only at the start.';
  }
  const digits = phone.replace(/\D/g, '').length;
  return digits < PHONE_DIGITS.min || digits > PHONE_DIGITS.max
    ? `Enter a phone number with ${PHONE_DIGITS.min} to ${PHONE_DIGITS.max} digits.`
    : null;
}

export function countryProblem(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return 'Choose the country to send it to.';
  }
  return countryNamed(value) ? null : 'Choose a country from the list.';
}

/** A street needs words, not only a number, so a carrier can find it. */
export function streetProblem(value: string): string | null {
  const street = value.trim();
  const fits = street.length >= STREET.min && street.length <= STREET.max;
  return fits && /\p{L}/u.test(street) ? null : 'Enter the street and number, like 12 Loom Street.';
}

export function cityProblem(value: string): string | null {
  const city = value.trim();
  if (!city) {
    return 'Enter the city.';
  }
  return city.length >= 2 && city.length <= CITY_MAX && WORDS.test(city)
    ? null
    : 'Use letters for the city.';
}

/** The state or province, where the country's addresses name one. */
export function regionProblem(country: string, value: string): string | null {
  const division = countryNamed(country)?.division;
  if (!division) {
    return null;
  }
  return regionNamed(division.options, value) ? null : `Choose the ${division.noun}.`;
}

/** The country's own postal format; nothing is asked where the country has no postal codes. */
export function postalCodeProblem(country: string, value: string): string | null {
  const rule = countryNamed(country)?.postal;
  if (!rule) {
    return null;
  }
  if (!value.trim()) {
    return `Enter the ${rule.noun}.`;
  }
  return postalParts(rule, value)
    ? null
    : `Enter ${rule.article} ${rule.noun} like ${rule.example}: ${rule.shape}.`;
}

/**
 * The server's check: an order the checkout form would have stopped is refused with the same words. An
 * order picked up at the shop has no address to check.
 */
export function assertDeliverable(
  draft: Pick<CheckoutDraft, 'contact' | 'delivery' | 'shipping'>,
): void {
  const problem = contactProblem(draft.contact) ?? addressProblem(draft);
  if (problem) {
    throw new ShopRuleError(problem);
  }
}

function addressProblem(draft: Pick<CheckoutDraft, 'delivery' | 'shipping'>): string | null {
  if (draft.delivery !== 'ship') {
    return null;
  }
  return draft.shipping ? shippingProblem(draft.shipping) : 'Enter the address to ship to.';
}

export function contactProblem(contact: ContactDetails): string | null {
  return nameProblem(contact.name) ?? emailProblem(contact.email) ?? phoneProblem(contact.phone);
}

/** The first thing to fix, in the order the checkout asks for them. */
export function shippingProblem(shipping: ShippingDetails): string | null {
  return (
    countryProblem(shipping.country) ??
    streetProblem(shipping.line1) ??
    cityProblem(shipping.city) ??
    regionProblem(shipping.country, shipping.region) ??
    postalCodeProblem(shipping.country, shipping.postalCode)
  );
}

/** A postal code written the way its country prints it, such as K1A 0B1 or 1100-148; unchanged if it does not fit. */
export function normalizedPostalCode(country: string, value: string): string {
  const rule = countryNamed(country)?.postal;
  const parts = rule ? postalParts(rule, value) : null;
  return parts && rule ? parts.join(rule.separator) : value.trim();
}

/**
 * The address as the order keeps it: the country's English name, the region as listed, the postal
 * code in the country's format, and no region or postal code where the country has none.
 */
export function normalizedShipping(shipping: ShippingDetails): ShippingDetails {
  const country = countryNamed(shipping.country);
  return {
    line1: tidy(shipping.line1),
    city: tidy(shipping.city),
    region: country?.division ? (regionNamed(country.division.options, shipping.region) ?? '') : '',
    postalCode: postalCodeFor(country, shipping),
    country: country?.name ?? tidy(shipping.country),
  };
}

function postalCodeFor(country: Country | null, shipping: ShippingDetails): string {
  if (country && !country.postal) {
    return '';
  }
  return normalizedPostalCode(shipping.country, shipping.postalCode);
}

function regionNamed(options: readonly string[], value: string): string | null {
  const wanted = value.trim().toLowerCase();
  return options.find((option) => option.toLowerCase() === wanted) ?? null;
}

/** The parts the country's pattern captures, from the code in capitals without spaces or hyphens. */
function postalParts(rule: NonNullable<Country['postal']>, value: string): string[] | null {
  const match = rule.pattern.exec(value.toUpperCase().replace(/[\s-]/g, ''));
  return match ? match.slice(1).filter((part) => part !== undefined) : null;
}

function tidy(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ');
}
