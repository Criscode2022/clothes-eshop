import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ApplicationRef,
  EnvironmentProviders,
  Injectable,
  Injector,
  PLATFORM_ID,
  REQUEST,
  Service,
  TransferState,
  effect,
  inject,
  makeEnvironmentProviders,
  makeStateKey,
  provideAppInitializer,
  signal,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { ShopClient } from '../shop/shop-client';
import {
  LANGUAGE_COOKIE,
  LANGUAGE_COOKIE_MAX_AGE,
  asLocale,
  localeFromHints,
} from './locale';
import type { Locale } from './locale';
import { loadSpanish, translate } from './translate';

const LOCALE_KEY = makeStateKey<Locale>('marlow.locale');

const DESCRIPTION =
  'Marlow, a ready-to-wear shop. Browse the floor, check out as a guest, or sign in.';

/**
 * The language of this visit. English unless the browser asks for Spanish, or the shopper has chosen.
 * The server decides from the request, and the browser reuses that decision so hydration matches.
 */
@Service()
export class Language {
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);
  private readonly appRef = inject(ApplicationRef);
  private readonly localeSignal = signal<Locale>('en');
  private wanted: Locale = 'en';

  readonly locale = this.localeSignal.asReadonly();

  /** The language for this load. It does not write the cookie: only a choice does. */
  use(locale: Locale): void {
    this.localeSignal.set(locale);
    this.applyDocument();
  }

  /** The shopper picked a language. The cookie, the page, and their profile follow. */
  async choose(locale: Locale): Promise<void> {
    this.wanted = locale;
    if (this.localeSignal() === locale) {
      return;
    }
    if (locale === 'es') {
      await loadSpanish();
    }
    if (this.wanted !== locale) {
      return;
    }
    this.use(locale);
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.writeCookie(locale);
    try {
      void this.injector.get(ShopClient).rememberLocale(locale);
    } catch {
      // The page still switches. The profile is remembered when the shop client can be built.
    }
    // The language signal sits outside the click's bindings. A later check redraws the page.
    queueMicrotask(() => this.appRef.tick());
  }

  private applyDocument(): void {
    const locale = this.localeSignal();
    this.document.documentElement?.setAttribute('lang', locale);
    this.meta.updateTag({ name: 'description', content: translate(locale, DESCRIPTION) });
  }

  private writeCookie(locale: Locale): void {
    const secure = this.document.location.protocol === 'https:' ? '; Secure' : '';
    this.document.cookie = `${LANGUAGE_COOKIE}=${locale}; Path=/; Max-Age=${LANGUAGE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
  }
}

/**
 * Route titles stay English in the route table. This writes the one for the current language, and
 * again when the language changes. It does not ask the router for anything.
 */
@Injectable()
export class ShopTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly language = inject(Language);
  private readonly snapshot = signal<RouterStateSnapshot | null>(null);

  constructor() {
    super();
    effect(() => {
      const snapshot = this.snapshot();
      if (snapshot) {
        this.write(snapshot, this.language.locale());
      }
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.snapshot.set(snapshot);
  }

  private write(snapshot: RouterStateSnapshot, locale: Locale): void {
    const built = this.buildTitle(snapshot);
    if (built) {
      this.title.setTitle(translate(locale, built));
    }
  }
}

export function provideLanguage(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: TitleStrategy, useClass: ShopTitleStrategy },
    provideAppInitializer(startLanguage),
  ]);
}

async function startLanguage(): Promise<void> {
  const language = inject(Language);
  const transfer = inject(TransferState);
  const platformId = inject(PLATFORM_ID);
  const locale = isPlatformBrowser(platformId)
    ? browserLocale(transfer)
    : serverLocale(transfer);
  if (locale === 'es') {
    await loadSpanish();
  }
  language.use(locale);
}

/** The server's choice, when this page was rendered there. Otherwise the cookie, then the browser. */
function browserLocale(transfer: TransferState): Locale {
  if (transfer.hasKey(LOCALE_KEY)) {
    return asLocale(transfer.get(LOCALE_KEY, 'en'));
  }
  const document = inject(DOCUMENT);
  return localeFromHints(document.cookie, navigator.language);
}

function serverLocale(transfer: TransferState): Locale {
  const request = inject(REQUEST, { optional: true });
  const locale = localeFromHints(
    request?.headers.get('cookie'),
    request?.headers.get('accept-language'),
  );
  transfer.set(LOCALE_KEY, locale);
  return locale;
}
