/**
 * Where an order is picked up: the counter on Marlow's own shop floor. The address is fictional, like
 * the bank account (`MARLOW_ACCOUNT`): this is a demo shop.
 */
export const PICKUP_POINT = {
  name: 'Marlow',
  lines: ['14 Selvedge Row', 'Providence, Rhode Island 02903', 'United States'],
  hours: 'Monday to Saturday, 10 am to 7 pm',
} as const;
