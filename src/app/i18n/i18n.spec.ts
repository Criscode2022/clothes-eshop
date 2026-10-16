import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SPANISH } from './es';
import { Language } from './language';
import { localeFromHints, readLanguageCookie } from './locale';
import { TranslatePipe } from './translate.pipe';
import { placeholdersOf, translate } from './translate';

describe('the language of a visit', () => {
  it('stays English unless the first browser language is Spanish', () => {
    expect(localeFromHints(null, null)).toBe('en');
    expect(localeFromHints('', 'en-US,en;q=0.9')).toBe('en');
    expect(localeFromHints('', 'fr-FR,es;q=0.8')).toBe('en');
    expect(localeFromHints('', 'es')).toBe('es');
    expect(localeFromHints('', 'es-MX,en;q=0.5')).toBe('es');
    expect(localeFromHints('', 'ES-es')).toBe('es');
  });

  it('keeps a saved choice over the browser language', () => {
    expect(readLanguageCookie('marlow.bag=1; marlow.lang=es')).toBe('es');
    expect(readLanguageCookie('marlow.lang=en')).toBe('en');
    expect(readLanguageCookie('marlow.lang=fr')).toBeNull();
    expect(localeFromHints('marlow.lang=en', 'es-ES')).toBe('en');
    expect(localeFromHints('marlow.lang=es', 'en-US')).toBe('es');
  });
});

describe('Spanish copy', () => {
  it('leaves English as written, and fills the same placeholders', () => {
    expect(translate('en', 'Your Marlow order {reference}', { reference: 'MR-1001' })).toBe(
      'Your Marlow order MR-1001',
    );
    expect(translate('es', 'This sentence has no Spanish yet.')).toBe(
      'This sentence has no Spanish yet.',
    );
  });

  it('keeps every placeholder the English sentence uses', () => {
    for (const [english, spanish] of Object.entries(SPANISH)) {
      expect(placeholdersOf(spanish), english).toEqual(placeholdersOf(english));
    }
  });

  it('translates a finished address sentence that names the country rule', () => {
    expect(translate('es', 'Choose the prefecture.')).toBe('Elige la prefectura.');
    expect(translate('es', 'Enter a ZIP code like 02903: 5 digits, or ZIP+4.')).toBe(
      'Escribe un código ZIP como 02903: 5 dígitos, o ZIP+4.',
    );
    expect(translate('en', 'Choose the prefecture.')).toBe('Choose the prefecture.');
  });
});

@Component({
  imports: [TranslatePipe],
  template: `<p>{{ 'Shop' | t }}</p>`,
})
class SampleCopy {}

describe('the language on a page', () => {
  afterEach(() => {
    document.cookie = 'marlow.lang=; Path=/; Max-Age=0';
    document.documentElement.lang = 'en';
  });

  it('follows the language the shopper chooses', async () => {
    TestBed.configureTestingModule({ imports: [SampleCopy] });
    const fixture = TestBed.createComponent(SampleCopy);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Shop');

    await TestBed.inject(Language).choose('es');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Tienda');
    expect(document.documentElement.lang).toBe('es');
  });
});
