/** The shop's languages. English is the source; Spanish is the other. */
export const LOCALES = ['en', 'es'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** The shopper's choice, read on the next load by the server and the browser. */
export const LANGUAGE_COOKIE = 'marlow.lang';

/** A year, so a choice outlives a session. */
export const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function asLocale(value: unknown): Locale {
  return value === 'es' ? 'es' : 'en';
}

/** The saved choice, or null when the cookie is missing or not a language the shop speaks. */
export function readLanguageCookie(cookieHeader: string | null | undefined): Locale | null {
  if (!cookieHeader) {
    return null;
  }
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) {
      continue;
    }
    const name = part.slice(0, separator).trim();
    if (name !== LANGUAGE_COOKIE) {
      continue;
    }
    const value = decodeURIComponent(part.slice(separator + 1).trim());
    return value === 'en' || value === 'es' ? value : null;
  }
  return null;
}

/**
 * The first language a browser asks for. `es` and `es-*` are Spanish. Everything else, including an
 * empty header, is English.
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  const first = header?.split(',')[0]?.split(';')[0]?.trim().toLowerCase() ?? '';
  return first === 'es' || first.startsWith('es-') ? 'es' : 'en';
}

/** A saved choice wins. Otherwise the browser's first language decides. */
export function localeFromHints(
  cookieHeader: string | null | undefined,
  acceptLanguage: string | null | undefined,
): Locale {
  return readLanguageCookie(cookieHeader) ?? localeFromAcceptLanguage(acceptLanguage);
}
