import { SPANISH } from '../i18n/es';
import {
  cityProblem,
  countryProblem,
  emailProblem,
  nameProblem,
  normalizedShipping,
  phoneProblem,
  postalCodeProblem,
  regionProblem,
  streetProblem,
} from './address-rules';
import { addressLines } from './checkout';
import type { ContactDetails, ShippingDetails, ShopOrder } from './checkout';
import { COUNTRIES, countryNamed, matchesCountry } from './countries';
import { handleShopHttp, resetShopServer } from './shop-server';

describe('contact rules', () => {
  it('takes a name made of letters, in any script', () => {
    expect(
      ['Ada Lovelace', "Zoë D'Arcy-Smith", 'José María Núñez', '李小龙', 'Dr. Ada K. Lovelace'].map(
        nameProblem,
      ),
    ).toEqual([null, null, null, null, null]);
    expect(nameProblem('A')).toBe('Enter your full name.');
    expect(nameProblem('1234')).toBe('Use letters for the name.');
    expect(nameProblem('Ada <Lovelace>')).toBe('Use letters for the name.');
  });

  it('wants a whole email address, with a dot in the domain', () => {
    expect(['ada@example.com', 'ada.lovelace+shop@mail.example.co.uk'].map(emailProblem)).toEqual([
      null,
      null,
    ]);
    for (const wrong of [
      'ada',
      'ada@example',
      'ada@@example.com',
      'ada lovelace@example.com',
      'ada@example..com',
      'ada@.example.com',
      'ada@example.c',
      '.ada@example.com',
    ]) {
      expect(emailProblem(wrong)).toBe('Enter an email address, like name@example.com.');
    }
    expect(emailProblem('')).toBe('Enter an email for the receipt.');
  });

  it('takes a phone number of 7 to 15 digits, written the usual ways', () => {
    expect(
      ['+1 (401) 555-0148', '+34 612 345 678', '612345678', '0044 20 7946 0958'].map(phoneProblem),
    ).toEqual([null, null, null, null]);
    expect(phoneProblem('')).toBe('Enter a phone number.');
    expect(phoneProblem('call me')).toBe(
      'Use digits for the phone number, with + only at the start.',
    );
    expect(phoneProblem('555 01+48')).toBe(
      'Use digits for the phone number, with + only at the start.',
    );
    expect(phoneProblem('555 014')).toBe('Enter a phone number with 7 to 15 digits.');
    expect(phoneProblem('+1 401 555 0148 0000 99')).toBe(
      'Enter a phone number with 7 to 15 digits.',
    );
  });
});

describe('address rules', () => {
  it('wants a street with words in it, and a city name', () => {
    expect(['12 Loom Street', 'Calle Mayor 5, 3º B', 'Rose Cottage'].map(streetProblem)).toEqual([
      null,
      null,
      null,
    ]);
    expect(streetProblem('12')).toBe('Enter the street and number, like 12 Loom Street.');
    expect(streetProblem('12345')).toBe('Enter the street and number, like 12 Loom Street.');
    expect(
      ['Providence', 'Saint-Étienne', "Xi'an", 'St. John’s', 'São Paulo'].map(cityProblem),
    ).toEqual([null, null, null, null, null]);
    expect(cityProblem('')).toBe('Enter the city.');
    expect(cityProblem('28013')).toBe('Use letters for the city.');
  });

  it('only ships to the countries on its list', () => {
    expect(countryProblem('Spain')).toBeNull();
    expect(countryProblem('')).toBe('Choose the country to send it to.');
    expect(countryProblem('Narnia')).toBe('Choose a country from the list.');
  });

  it('checks each country own postal code', () => {
    const cases: [string, string, boolean][] = [
      ['United States', '02903', true],
      ['United States', '02903-1234', true],
      ['United States', '2903', false],
      ['Spain', '28013', true],
      ['Spain', '01001', true],
      ['Spain', '53001', false],
      ['Spain', '2801', false],
      ['Canada', 'K1A 0B1', true],
      ['Canada', 'D1A 0B1', false],
      ['United Kingdom', 'SW1A 1AA', true],
      ['United Kingdom', 'W1A 0AX', true],
      ['United Kingdom', 'SW1A', false],
      ['Netherlands', '1012 AB', true],
      ['Netherlands', '1012 SS', false],
      ['Portugal', '1100-148', true],
      ['Germany', '10115', true],
      ['Germany', '00115', false],
      ['France', '75008', true],
      ['France', '99000', false],
      ['Poland', '00-950', true],
      ['Sweden', '114 55', true],
      ['Ireland', 'D02 X285', true],
      ['Ireland', 'B02 X285', false],
      ['Japan', '100-0001', true],
      ['Brazil', '01310-100', true],
      ['India', '110001', true],
      ['India', '010001', false],
      ['Argentina', 'C1425ABC', true],
      ['Argentina', '1425', true],
      ['Mexico', '06600', true],
      ['China', '100000', true],
      ['Türkiye', '34000', true],
      ['Türkiye', '99000', false],
    ];
    for (const [country, code, valid] of cases) {
      expect([country, code, postalCodeProblem(country, code) === null]).toEqual([
        country,
        code,
        valid,
      ]);
    }
    expect(postalCodeProblem('Spain', '')).toBe('Enter the postal code.');
    expect(postalCodeProblem('Spain', '53001')).toBe(
      'Enter a postal code like 28013: 5 digits, starting 01 to 52.',
    );
    expect(postalCodeProblem('United States', '2903')).toBe(
      'Enter a ZIP code like 02903: 5 digits, or ZIP+4.',
    );
  });

  it('asks no postal code where the country has none', () => {
    expect(postalCodeProblem('Hong Kong', '')).toBeNull();
    expect(postalCodeProblem('United Arab Emirates', '')).toBeNull();
  });

  it('asks for the state or province where addresses need one', () => {
    expect(regionProblem('United States', 'Rhode Island')).toBeNull();
    expect(regionProblem('United States', '')).toBe('Choose the state.');
    expect(regionProblem('United States', 'Ontario')).toBe('Choose the state.');
    expect(regionProblem('Canada', 'Ontario')).toBeNull();
    expect(regionProblem('Japan', '')).toBe('Choose the prefecture.');
    expect(regionProblem('Spain', '')).toBeNull();
  });

  it('stores the country, the region, and the postal code the way that country writes them', () => {
    expect(
      normalizedShipping({
        line1: '  24 Sussex Drive ',
        city: ' Ottawa',
        region: 'ontario',
        postalCode: 'k1m1m4',
        country: 'canada',
      }),
    ).toEqual({
      line1: '24 Sussex Drive',
      city: 'Ottawa',
      region: 'Ontario',
      postalCode: 'K1M 1M4',
      country: 'Canada',
    });
    expect(
      normalizedShipping({
        line1: '1 Rua Augusta',
        city: 'Lisboa',
        region: '',
        postalCode: '1100148',
        country: 'PT',
      }),
    ).toMatchObject({ postalCode: '1100-148', country: 'Portugal' });
    expect(
      normalizedShipping({
        line1: '1 Queen’s Road',
        city: 'Central',
        region: 'x',
        postalCode: 'x',
        country: 'Hong Kong',
      }),
    ).toMatchObject({ region: '', postalCode: '' });
  });
});

describe('how an address reads', () => {
  it('puts the region beside the city and leaves out what a country does not have', () => {
    expect(
      addressLines({
        line1: '12 Loom Street',
        city: 'Providence',
        region: 'Rhode Island',
        postalCode: '02903',
        country: 'United States',
      }),
    ).toEqual(['12 Loom Street', 'Providence, Rhode Island 02903', 'United States']);
    expect(
      addressLines({
        line1: 'Calle Mayor 5',
        city: 'Madrid',
        region: '',
        postalCode: '28013',
        country: 'Spain',
      }),
    ).toEqual(['Calle Mayor 5', 'Madrid 28013', 'Spain']);
    expect(
      addressLines({
        line1: '1 Queen’s Road',
        city: 'Central',
        region: '',
        postalCode: '',
        country: 'Hong Kong',
      }),
    ).toEqual(['1 Queen’s Road', 'Central', 'Hong Kong']);
  });
});

describe('the country list', () => {
  it('covers the main countries of the Americas, Europe, and Asia, each once', () => {
    const names = COUNTRIES.map((country) => country.name);
    expect(new Set(names).size).toBe(names.length);
    for (const name of [
      'United States',
      'Canada',
      'Mexico',
      'Brazil',
      'Spain',
      'France',
      'Germany',
      'United Kingdom',
      'Italy',
      'Japan',
      'China',
      'India',
      'South Korea',
    ]) {
      expect(names).toContain(name);
    }
    expect(new Set(COUNTRIES.map((country) => country.continent))).toEqual(
      new Set(['Americas', 'Europe', 'Asia']),
    );
  });

  it('lists every state or province once', () => {
    const counts = Object.fromEntries(
      COUNTRIES.filter((country) => country.division).map((country) => [
        country.code,
        country.division!.options.length,
      ]),
    );
    expect(counts).toEqual({ US: 52, CA: 13, MX: 32, BR: 27, AR: 24, IN: 36, JP: 47, CN: 31 });
    for (const country of COUNTRIES) {
      const options = country.division?.options ?? [];
      expect(new Set(options).size).toBe(options.length);
    }
  });

  it('finds a country by the start of a word in its name, its code, or the name its people use', () => {
    expect(countryNamed('spain')?.name).toBe('Spain');
    expect(countryNamed('ES')?.name).toBe('Spain');
    expect(countryNamed('Narnia')).toBeNull();
    expect(matchesCountry('Spain', 'españa')).toBe(true);
    expect(matchesCountry('United Kingdom', 'uk')).toBe(true);
    expect(matchesCountry('Germany', 'deutsch')).toBe(true);
    expect(matchesCountry('Germany', 'spa')).toBe(false);
    expect(matchesCountry('United Kingdom', 'kingdom')).toBe(true);
    expect(matchesCountry('United States', 'united st')).toBe(true);
    expect(matchesCountry('Hong Kong', 'hong')).toBe(true);
    expect(matchesCountry('China', 'hong')).toBe(false);
  });

  it('finds every country by the Spanish name its list shows', () => {
    for (const country of COUNTRIES) {
      const spanish = SPANISH[country.name] ?? country.name;
      expect([country.name, matchesCountry(country.name, spanish)]).toEqual([country.name, true]);
    }
  });
});

describe('the server', () => {
  beforeEach(() => resetShopServer());

  const ADA = { name: 'Ada Lovelace', email: 'ada@example.com', phone: '+1 401 555 0148' };
  const PROVIDENCE = {
    line1: '12 Loom Street',
    city: 'Providence',
    region: 'Rhode Island',
    postalCode: '02903',
    country: 'United States',
  };

  function place(
    shipping: Partial<ShippingDetails>,
    contact: Partial<ContactDetails> = {},
  ): { status: number; body: unknown } {
    return handleShopHttp(
      'POST',
      '/api/orders',
      {
        contact: { ...ADA, ...contact },
        delivery: 'ship',
        shipping: { ...PROVIDENCE, ...shipping },
        paymentMethod: 'bank-transfer',
        lines: [{ productId: 'oxford-shirt', variantId: 'oxford-shirt-m-white', quantity: 1 }],
      },
      null,
    );
  }

  it('refuses an order the checkout form would have stopped', () => {
    expect(place({}, { email: 'ada@example' }).body).toEqual({
      message: 'Enter an email address, like name@example.com.',
    });
    expect(place({ region: '' }).body).toEqual({ message: 'Choose the state.' });
    expect(place({ country: 'Spain', region: '', postalCode: '53001' }).body).toEqual({
      message: 'Enter a postal code like 28013: 5 digits, starting 01 to 52.',
    });
    expect(place({ country: 'Narnia' }).status).toBe(400);
  });

  it('keeps the address the way its country writes it', () => {
    const placed = place({
      line1: '24 Sussex Drive',
      city: 'Ottawa',
      region: 'ontario',
      postalCode: 'k1m1m4',
      country: 'canada',
    });

    expect(placed.status).toBe(201);
    expect((placed.body as ShopOrder).shipping).toEqual({
      line1: '24 Sussex Drive',
      city: 'Ottawa',
      region: 'Ontario',
      postalCode: 'K1M 1M4',
      country: 'Canada',
    });
  });
});
