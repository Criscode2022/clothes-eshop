import type { Locale } from './locale';

export type CopyParams = Readonly<Record<string, string | number>>;

/** Spanish sentences, loaded when a visit is in Spanish. English never needs them. */
let spanish: Readonly<Record<string, string>> | null = null;

/** Hands the dictionary to mail and to tests that already imported it. */
export function useSpanish(copy: Readonly<Record<string, string>>): void {
  spanish = copy;
}

/** Loads the dictionary once. A Spanish page waits for this before it renders. */
export async function loadSpanish(): Promise<void> {
  if (!spanish) {
    spanish = (await import('./es')).SPANISH;
  }
}

const NOUNS: Readonly<Record<string, { the: string; a: string }>> = {
  'postal code': { the: 'el código postal', a: 'un código postal' },
  CEP: { the: 'el CEP', a: 'un CEP' },
  'ZIP code': { the: 'el código ZIP', a: 'un código ZIP' },
  Eircode: { the: 'el Eircode', a: 'un Eircode' },
  postcode: { the: 'el código postal', a: 'un código postal' },
  'PIN code': { the: 'el código PIN', a: 'un código PIN' },
  province: { the: 'la provincia', a: 'una provincia' },
  state: { the: 'el estado', a: 'un estado' },
  'province or territory': { the: 'la provincia o el territorio', a: 'una provincia o un territorio' },
  'state or union territory': {
    the: 'el estado o el territorio de la unión',
    a: 'un estado o un territorio de la unión',
  },
  prefecture: { the: 'la prefectura', a: 'una prefectura' },
};

/** The shape a postal error names, after the example. */
const SHAPES: Readonly<Record<string, string>> = {
  '5 digits': '5 dígitos',
  '4 digits': '4 dígitos',
  '6 digits': '6 dígitos',
  '7 digits': '7 dígitos',
  '8 digits': '8 dígitos',
  '5 digits, or ZIP+4': '5 dígitos, o ZIP+4',
  'a letter, 4 digits, and 3 letters, or 4 digits':
    'una letra, 4 dígitos y 3 letras, o 4 dígitos',
  'letter, digit, letter, then digit, letter, digit':
    'letra, dígito, letra, luego dígito, letra, dígito',
  'a routing key like D02, then 4 characters': 'una clave como D02 y luego 4 caracteres',
  '4 digits and 2 letters': '4 dígitos y 2 letras',
  '5 digits, starting 01 to 52': '5 dígitos, del 01 al 52',
  'an area like SW1A, then a digit and 2 letters':
    'un área como SW1A, luego un dígito y 2 letras',
  '6 digits, not starting with 0': '6 dígitos, sin empezar por 0',
  '3, 5, or 6 digits': '3, 5 o 6 dígitos',
  '5 digits, starting 01 to 81': '5 dígitos, del 01 al 81',
};

const ORDER_STATES: Readonly<Record<string, string>> = {
  'order placed': 'pedido hecho',
  'being prepared': 'en preparación',
  'on its way': 'en camino',
  'ready to pick up': 'listo para recoger',
  delivered: 'entregado',
  'picked up': 'recogido',
  cancelled: 'cancelado',
  'Order placed': 'Pedido hecho',
  'Being prepared': 'En preparación',
  'On its way': 'En camino',
  'Ready to pick up': 'Listo para recoger',
  Delivered: 'Entregado',
  'Picked up': 'Recogido',
  Cancelled: 'Cancelado',
};

/**
 * The English sentence, or its Spanish when that language is on. A sentence with no Spanish stays
 * English. `{name}` is filled from `params` in either language.
 */
export function translate(locale: Locale, english: string, params?: CopyParams): string {
  const template = locale === 'es' ? (spanish?.[english] ?? patterned(english) ?? english) : english;
  return params ? fill(template, params) : template;
}

/** The `{name}` markers in a sentence, in the order they appear. */
export function placeholdersOf(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]);
}

function fill(template: string, params: CopyParams): string {
  return template.replace(/\{(\w+)\}/g, (token, key: string) => {
    const value = params[key];
    return value === undefined ? token : String(value);
  });
}

/**
 * Address and stock sentences name a country or a count, so the finished English is never one key.
 * The shape is fixed; only the named part changes.
 */
function patterned(english: string): string | null {
  const enterThe = /^Enter the (.+)\.$/.exec(english);
  if (enterThe && NOUNS[enterThe[1]]) {
    return `Escribe ${NOUNS[enterThe[1]].the}.`;
  }
  const enterLike = /^Enter (a|an) (.+) like ([^:]+): (.+)\.$/.exec(english);
  if (enterLike && NOUNS[enterLike[2]]) {
    const shape = SHAPES[enterLike[4]] ?? enterLike[4];
    return `Escribe ${NOUNS[enterLike[2]].a} como ${enterLike[3]}: ${shape}.`;
  }
  const choose = /^Choose the (.+)\.$/.exec(english);
  if (choose && NOUNS[choose[1]]) {
    return `Elige ${NOUNS[choose[1]].the}.`;
  }
  const nameLimit = /^Keep the name under (\d+) characters\.$/.exec(english);
  if (nameLimit) {
    return `El nombre, en menos de ${nameLimit[1]} caracteres.`;
  }
  const phoneDigits = /^Enter a phone number with (\d+) to (\d+) digits\.$/.exec(english);
  if (phoneDigits) {
    return `Escribe un teléfono de ${phoneDigits[1]} a ${phoneDigits[2]} dígitos.`;
  }
  const only = /^Only (\d+) of that size are in stock\.$/.exec(english);
  if (only) {
    return `Solo hay ${only[1]} de esa talla.`;
  }
  const stayed = /^An order that is (.+) can no longer be cancelled\.$/.exec(english);
  if (stayed && ORDER_STATES[stayed[1]]) {
    return `Un pedido que está ${ORDER_STATES[stayed[1]]} ya no se puede cancelar.`;
  }
  const jump = /^This order cannot go from “(.+)” to “(.+)”\.$/.exec(english);
  if (jump && ORDER_STATES[jump[1]] && ORDER_STATES[jump[2]]) {
    return `Este pedido no puede pasar de «${ORDER_STATES[jump[1]]}» a «${ORDER_STATES[jump[2]]}».`;
  }
  const cancelledPay = /^Order (\S+) was cancelled, so there is nothing to pay\.$/.exec(english);
  if (cancelledPay) {
    return `El pedido ${cancelledPay[1]} se canceló, así que no hay nada que pagar.`;
  }
  const savedPrice = /^Saved\. (.+) now shows at the new price\.$/.exec(english);
  if (savedPrice) {
    return `Guardado. ${named(savedPrice[1])} ya se muestra al precio nuevo.`;
  }
  const added = /^Added (.+) ([^ ]+)\.$/.exec(english);
  if (added) {
    return `Añadido ${named(added[1])} ${added[2]}.`;
  }
  const moved = /^(\S+) is now (.+)\.$/.exec(english);
  if (moved && ORDER_STATES[moved[2]]) {
    return `${moved[1]} está ahora ${ORDER_STATES[moved[2]]}.`;
  }
  const stuck = /^(\S+) could not be moved\.$/.exec(english);
  if (stuck) {
    return `${stuck[1]} no se pudo mover.`;
  }
  return null;
}

/** A product or color named inside a finished sentence, in Spanish when the floor has a name for it. */
function named(english: string): string {
  return spanish?.[english] ?? english;
}
