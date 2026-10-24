import {
  ARGENTINE_PROVINCES,
  BRAZILIAN_STATES,
  CANADIAN_PROVINCES,
  CHINESE_PROVINCES,
  INDIAN_STATES,
  JAPANESE_PREFECTURES,
  MEXICAN_STATES,
  US_STATES,
} from './country-divisions';

export type Continent = 'Americas' | 'Europe' | 'Asia';

/** How a country writes its postal codes, and how the checkout asks for one. */
export interface PostalRule {
  /** The field's label, in the country's own term: ZIP code, Postcode, Eircode. */
  readonly label: string;
  /** The same term inside a sentence: "Enter the ZIP code", "Enter a postcode like …". */
  readonly noun: string;
  readonly article: 'a' | 'an';
  /** Matched against the code in capitals with its spaces and hyphens taken out. */
  readonly pattern: RegExp;
  /** What joins the parts the pattern captures, as the country writes the code. */
  readonly separator: '' | ' ' | '-';
  readonly example: string;
  /** The shape in words, for the error message. */
  readonly shape: string;
  /** Digits only, so a phone shows its number pad. */
  readonly digits: boolean;
}

/** The state, province, or prefecture an address names, where mail expects one. */
export interface Division {
  readonly label: string;
  readonly noun: string;
  readonly options: readonly string[];
}

export interface Country {
  /** ISO 3166-1 alpha-2. */
  readonly code: string;
  /** The English name, which the order stores. */
  readonly name: string;
  readonly continent: Continent;
  /** The international calling code. */
  readonly dial: string;
  /** Other names a shopper may type: the country's own name, a common short form. */
  readonly aliases: readonly string[];
  /** Null where the country has no postal codes. */
  readonly postal: PostalRule | null;
  /** Null where an address needs no state or province. */
  readonly division: Division | null;
}

const POSTAL_CODE = { label: 'Postal code', noun: 'postal code', article: 'a' } as const;

function postal(
  pattern: RegExp,
  example: string,
  shape: string,
  separator: PostalRule['separator'] = '',
  term: Pick<PostalRule, 'label' | 'noun' | 'article'> = POSTAL_CODE,
): PostalRule {
  return { ...term, pattern, separator, example, shape, digits: /^[\d\s-]+$/.test(example) };
}

const fiveDigits = (example: string): PostalRule => postal(/^(\d{5})$/, example, '5 digits');
const fourDigits = (example: string): PostalRule => postal(/^([1-9]\d{3})$/, example, '4 digits');
const sixDigits = (example: string): PostalRule => postal(/^(\d{6})$/, example, '6 digits');

function division(label: string, options: readonly string[]): Division {
  return { label, noun: label.toLowerCase(), options };
}

/**
 * Where Marlow ships: the main countries of the Americas, Europe, and Asia. Postal patterns follow each
 * country's postal service; a code that passes is written back the way that country prints it.
 */
export const COUNTRIES: readonly Country[] = [
  {
    code: 'AR',
    name: 'Argentina',
    continent: 'Americas',
    dial: '+54',
    aliases: [],
    postal: postal(
      /^([A-HJ-NP-Z]\d{4}[A-Z]{3}|\d{4})$/,
      'C1425ABC',
      'a letter, 4 digits, and 3 letters, or 4 digits',
    ),
    division: division('Province', ARGENTINE_PROVINCES),
  },
  {
    code: 'BR',
    name: 'Brazil',
    continent: 'Americas',
    dial: '+55',
    aliases: ['Brasil'],
    postal: postal(/^(\d{5})(\d{3})$/, '01310-100', '8 digits', '-', {
      label: 'CEP',
      noun: 'CEP',
      article: 'a',
    }),
    division: division('State', BRAZILIAN_STATES),
  },
  {
    code: 'CA',
    name: 'Canada',
    continent: 'Americas',
    dial: '+1',
    aliases: ['Canadá'],
    postal: postal(
      /^([ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z])(\d[ABCEGHJ-NPRSTV-Z]\d)$/,
      'K1A 0B1',
      'letter, digit, letter, then digit, letter, digit',
      ' ',
    ),
    division: division('Province or territory', CANADIAN_PROVINCES),
  },
  {
    code: 'CL',
    name: 'Chile',
    continent: 'Americas',
    dial: '+56',
    aliases: [],
    postal: postal(/^(\d{7})$/, '8320000', '7 digits'),
    division: null,
  },
  {
    code: 'CO',
    name: 'Colombia',
    continent: 'Americas',
    dial: '+57',
    aliases: [],
    postal: sixDigits('110111'),
    division: null,
  },
  {
    code: 'MX',
    name: 'Mexico',
    continent: 'Americas',
    dial: '+52',
    aliases: ['México'],
    postal: fiveDigits('06600'),
    division: division('State', MEXICAN_STATES),
  },
  {
    code: 'PE',
    name: 'Peru',
    continent: 'Americas',
    dial: '+51',
    aliases: ['Perú'],
    postal: fiveDigits('15074'),
    division: null,
  },
  {
    code: 'US',
    name: 'United States',
    continent: 'Americas',
    dial: '+1',
    aliases: ['USA', 'US', 'United States of America', 'America', 'Estados Unidos'],
    postal: postal(/^(\d{5})(\d{4})?$/, '02903', '5 digits, or ZIP+4', '-', {
      label: 'ZIP code',
      noun: 'ZIP code',
      article: 'a',
    }),
    division: division('State', US_STATES),
  },

  {
    code: 'AT',
    name: 'Austria',
    continent: 'Europe',
    dial: '+43',
    aliases: ['Österreich'],
    postal: fourDigits('1010'),
    division: null,
  },
  {
    code: 'BE',
    name: 'Belgium',
    continent: 'Europe',
    dial: '+32',
    aliases: ['België', 'Belgique', 'Bélgica'],
    postal: fourDigits('1000'),
    division: null,
  },
  {
    code: 'CZ',
    name: 'Czechia',
    continent: 'Europe',
    dial: '+420',
    aliases: ['Czech Republic', 'Česko', 'Chequia'],
    postal: postal(/^(\d{3})(\d{2})$/, '110 00', '5 digits', ' '),
    division: null,
  },
  {
    code: 'DK',
    name: 'Denmark',
    continent: 'Europe',
    dial: '+45',
    aliases: ['Danmark', 'Dinamarca'],
    postal: fourDigits('1050'),
    division: null,
  },
  {
    code: 'FI',
    name: 'Finland',
    continent: 'Europe',
    dial: '+358',
    aliases: ['Suomi', 'Finlandia'],
    postal: fiveDigits('00100'),
    division: null,
  },
  {
    code: 'FR',
    name: 'France',
    continent: 'Europe',
    dial: '+33',
    aliases: ['Francia'],
    postal: postal(/^((?:0[1-9]|[1-8]\d|9[0-8])\d{3})$/, '75008', '5 digits'),
    division: null,
  },
  {
    code: 'DE',
    name: 'Germany',
    continent: 'Europe',
    dial: '+49',
    aliases: ['Deutschland', 'Alemania'],
    postal: postal(/^((?!00)\d{5})$/, '10115', '5 digits'),
    division: null,
  },
  {
    code: 'GR',
    name: 'Greece',
    continent: 'Europe',
    dial: '+30',
    aliases: ['Hellas', 'Ελλάδα', 'Grecia'],
    postal: postal(/^(\d{3})(\d{2})$/, '105 57', '5 digits', ' '),
    division: null,
  },
  {
    code: 'IE',
    name: 'Ireland',
    continent: 'Europe',
    dial: '+353',
    aliases: ['Éire', 'Irlanda'],
    postal: postal(
      /^([AC-FHKNPRTV-Y]\d{2}|D6W)([0-9AC-FHKNPRTV-Y]{4})$/,
      'D02 X285',
      'a routing key like D02, then 4 characters',
      ' ',
      { label: 'Eircode', noun: 'Eircode', article: 'an' },
    ),
    division: null,
  },
  {
    code: 'IT',
    name: 'Italy',
    continent: 'Europe',
    dial: '+39',
    aliases: ['Italia'],
    postal: fiveDigits('00184'),
    division: null,
  },
  {
    code: 'NL',
    name: 'Netherlands',
    continent: 'Europe',
    dial: '+31',
    aliases: ['Holland', 'Nederland', 'Países Bajos'],
    postal: postal(
      /^([1-9]\d{3})((?!SA|SD|SS)[A-Z]{2})$/,
      '1012 AB',
      '4 digits and 2 letters',
      ' ',
    ),
    division: null,
  },
  {
    code: 'NO',
    name: 'Norway',
    continent: 'Europe',
    dial: '+47',
    aliases: ['Norge', 'Noruega'],
    postal: postal(/^(\d{4})$/, '0150', '4 digits'),
    division: null,
  },
  {
    code: 'PL',
    name: 'Poland',
    continent: 'Europe',
    dial: '+48',
    aliases: ['Polska', 'Polonia'],
    postal: postal(/^(\d{2})(\d{3})$/, '00-950', '5 digits', '-'),
    division: null,
  },
  {
    code: 'PT',
    name: 'Portugal',
    continent: 'Europe',
    dial: '+351',
    aliases: [],
    postal: postal(/^(\d{4})(\d{3})$/, '1100-148', '7 digits', '-'),
    division: null,
  },
  {
    code: 'ES',
    name: 'Spain',
    continent: 'Europe',
    dial: '+34',
    aliases: ['España'],
    postal: postal(/^((?:0[1-9]|[1-4]\d|5[0-2])\d{3})$/, '28013', '5 digits, starting 01 to 52'),
    division: null,
  },
  {
    code: 'SE',
    name: 'Sweden',
    continent: 'Europe',
    dial: '+46',
    aliases: ['Sverige', 'Suecia'],
    postal: postal(/^(\d{3})(\d{2})$/, '114 55', '5 digits', ' '),
    division: null,
  },
  {
    code: 'CH',
    name: 'Switzerland',
    continent: 'Europe',
    dial: '+41',
    aliases: ['Schweiz', 'Suisse', 'Svizzera', 'Suiza'],
    postal: fourDigits('8001'),
    division: null,
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    continent: 'Europe',
    dial: '+44',
    aliases: ['UK', 'Great Britain', 'Britain', 'England', 'Scotland', 'Wales', 'Reino Unido'],
    postal: postal(
      /^(GIR|[A-PR-UWYZ](?:\d{1,2}|[A-HK-Y]\d{1,2}|\d[A-HJKPSTUW]|[A-HK-Y]\d[ABEHMNPRVWXY]))(0AA|\d[ABD-HJLNP-UW-Z]{2})$/,
      'SW1A 1AA',
      'an area like SW1A, then a digit and 2 letters',
      ' ',
      { label: 'Postcode', noun: 'postcode', article: 'a' },
    ),
    division: null,
  },

  {
    code: 'CN',
    name: 'China',
    continent: 'Asia',
    dial: '+86',
    aliases: ['中国', 'Zhongguo'],
    postal: sixDigits('100000'),
    division: division('Province', CHINESE_PROVINCES),
  },
  {
    code: 'HK',
    name: 'Hong Kong',
    continent: 'Asia',
    dial: '+852',
    aliases: ['香港'],
    postal: null,
    division: null,
  },
  {
    code: 'IN',
    name: 'India',
    continent: 'Asia',
    dial: '+91',
    aliases: ['Bharat'],
    postal: postal(/^([1-9]\d{5})$/, '110001', '6 digits, not starting with 0', '', {
      label: 'PIN code',
      noun: 'PIN code',
      article: 'a',
    }),
    division: division('State or union territory', INDIAN_STATES),
  },
  {
    code: 'ID',
    name: 'Indonesia',
    continent: 'Asia',
    dial: '+62',
    aliases: [],
    postal: fiveDigits('10110'),
    division: null,
  },
  {
    code: 'IL',
    name: 'Israel',
    continent: 'Asia',
    dial: '+972',
    aliases: [],
    postal: postal(/^(\d{7})$/, '6473925', '7 digits'),
    division: null,
  },
  {
    code: 'JP',
    name: 'Japan',
    continent: 'Asia',
    dial: '+81',
    aliases: ['Nippon', 'Nihon', '日本', 'Japón'],
    postal: postal(/^(\d{3})(\d{4})$/, '100-0001', '7 digits', '-'),
    division: division('Prefecture', JAPANESE_PREFECTURES),
  },
  {
    code: 'MY',
    name: 'Malaysia',
    continent: 'Asia',
    dial: '+60',
    aliases: ['Malasia'],
    postal: fiveDigits('50450'),
    division: null,
  },
  {
    code: 'PH',
    name: 'Philippines',
    continent: 'Asia',
    dial: '+63',
    aliases: ['Pilipinas', 'Filipinas'],
    postal: postal(/^(\d{4})$/, '1000', '4 digits'),
    division: null,
  },
  {
    code: 'SG',
    name: 'Singapore',
    continent: 'Asia',
    dial: '+65',
    aliases: ['Singapur'],
    postal: sixDigits('238859'),
    division: null,
  },
  {
    code: 'KR',
    name: 'South Korea',
    continent: 'Asia',
    dial: '+82',
    aliases: ['Korea', '대한민국', 'Corea del Sur'],
    postal: fiveDigits('03187'),
    division: null,
  },
  {
    code: 'TW',
    name: 'Taiwan',
    continent: 'Asia',
    dial: '+886',
    aliases: ['臺灣', '台灣', 'Taiwán'],
    postal: postal(/^(\d{3}(?:\d{2,3})?)$/, '10048', '3, 5, or 6 digits'),
    division: null,
  },
  {
    code: 'TH',
    name: 'Thailand',
    continent: 'Asia',
    dial: '+66',
    aliases: ['Tailandia'],
    postal: postal(/^([1-9]\d{4})$/, '10330', '5 digits'),
    division: null,
  },
  {
    code: 'TR',
    name: 'Türkiye',
    continent: 'Asia',
    dial: '+90',
    aliases: ['Turkey', 'Turquía'],
    postal: postal(/^((?:0[1-9]|[1-7]\d|8[01])\d{3})$/, '34000', '5 digits, starting 01 to 81'),
    division: null,
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    continent: 'Asia',
    dial: '+971',
    aliases: ['UAE', 'Emirates', 'Emiratos Árabes Unidos'],
    postal: null,
    division: null,
  },
  {
    code: 'VN',
    name: 'Vietnam',
    continent: 'Asia',
    dial: '+84',
    aliases: ['Viet Nam'],
    postal: sixDigits('100000'),
    division: null,
  },
];

export const CONTINENTS: readonly Continent[] = ['Americas', 'Europe', 'Asia'];

/** A country on the list by its English name or its code, in any case; null when Marlow does not ship there. */
export function countryNamed(value: string | null | undefined): Country | null {
  const wanted = folded(value);
  if (!wanted) {
    return null;
  }
  return (
    COUNTRIES.find(
      (country) =>
        folded(country.name) === wanted ||
        country.code.toLowerCase() === wanted ||
        country.aliases.some((alias) => folded(alias) === wanted),
    ) ?? null
  );
}

/**
 * For the country search: the start of the English name, of the country's own names, or of any word in
 * them, or the code, accents aside. Starts of words, not any letters inside, so "hong" finds Hong Kong
 * and not China's "Zhongguo".
 */
export function matchesCountry(name: string, search: string): boolean {
  const query = folded(search);
  const country = countryNamed(name);
  if (!query || !country) {
    return !query;
  }
  return (
    country.code.toLowerCase() === query ||
    [country.name, ...country.aliases].some((term) => startsAWord(folded(term), query))
  );
}

function startsAWord(term: string, query: string): boolean {
  return term.startsWith(query) || term.split(/[\s-]+/).some((word) => word.startsWith(query));
}

/** Lower case, without accents, so "espana" finds España. A cleared field arrives as null. */
function folded(value: string | null | undefined): string {
  return (value ?? '').normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase();
}
