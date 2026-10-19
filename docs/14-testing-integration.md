---
title: Testing · integración
---

# Testing · integración

Varios módulos juntos, con lo externo sustituido en el borde. Casi todos llaman a `handleShopHttp(method, path, body, authorization)`, la función que el servidor Express usa para cada `/api/*`, y leen el resultado como lo leería el navegador. 11 ficheros, 69 tests.

| Fichero                          | Tests | Cubre                                                                                    |
| -------------------------------- | ----- | ---------------------------------------------------------------------------------------- |
| `shop/account-server.spec.ts`    | 11    | Sesión guardada, cuentas retiradas, cambiar nombre, borrar la cuenta con un JWT reciente |
| `mail/neon-auth-webhook.spec.ts` | 10    | Firma Ed25519, reintentos, enlaces de contraseña en el idioma recordado                  |
| `shop/pickup.spec.ts`            | 8     | Pedido para recoger: sin dirección, sin envío, pago en tienda solo ahí                   |
| `mail/shop-mail.spec.ts`         | 8     | Qué email sale en cada momento, y que un fallo no tumba el pedido                        |
| `shop/bank-transfer.spec.ts`     | 7     | Pago pendiente, enlace firmado, pagar una vez, cancelado no cobra                        |
| `shop/shop-domain.spec.ts`       | 7     | Catálogo, bolsa, checkout, permisos del personal y entrada del servidor                  |
| `shop/order-cancel.spec.ts`      | 6     | Quién cancela, hasta cuándo, y que el stock vuelve                                       |
| `shop/shop-presentation.spec.ts` | 4     | Tailwind 4 sobre tokens, SSR, sin Ionic, Archivo autoalojada, movimiento reducido        |
| `shop/neon-accounts.spec.ts`     | 3     | Renombrar y borrar en una transacción, con un cliente SQL falso                          |
| `shop/shop-migration.spec.ts`    | 3     | Las migraciones leídas como texto: RLS, permisos, sin tarjeta                            |
| `shop/neon-auth-relay.spec.ts`   | 2     | El relay devuelve la cookie como propia y rechaza rutas ajenas sin llamar a Neon         |

## Transferencia (`shop/bank-transfer.spec.ts`)

El enlace del email paga el pedido una sola vez; un código que no es el del pedido da 404 sin decir si el pedido existe.

```ts
it('marks the order paid once the transfer is sent, and only once', () => {
  const order = placed('bank-transfer', `Bearer ${openSession(ADA).token}`);
  const pay = apiPathOf(linkOf(order));

  const sent = handleShopHttp('POST', pay, {}, null);
  const again = handleShopHttp('POST', pay, {}, null);

  expect((sent.body as TransferDetails).state).toBe('paid');
  expect((again.body as TransferDetails).state).toBe('paid');
});

it('refuses a link whose code is not the shop own, without saying whether the order exists', () => {
  const order = placed();
  const forged = `/api/transfers/${order.reference}/not-the-code-for-this-order`;
  const refusal = { status: 404, body: { message: 'That payment link is not valid.' } };

  expect(handleShopHttp('GET', forged, null, null)).toEqual(refusal);
  expect(handleShopHttp('POST', forged, {}, null)).toEqual(refusal);
});
```

## Cancelar (`shop/order-cancel.spec.ts`)

```ts
it('lets a client cancel their own order and puts its pieces back on the floor', () => {
  const before = shirtsOnTheFloor();
  const order = shirtOrder(avery);
  expect(shirtsOnTheFloor()).toBe(before - 2);

  const cancelled = cancelOrder(avery, order.reference);

  expect(cancelled.fulfillment).toBe('cancelled');
  expect(shirtsOnTheFloor()).toBe(before);
});
```

Otros casos del fichero: no se cancela un pedido que ya salió, ni uno de otro cliente, ni uno de invitado, y sin sesión la API responde 403.

## Webhook de Neon Auth (`mail/neon-auth-webhook.spec.ts`)

El test genera su propio par de claves Ed25519 y firma los cuerpos como lo haría Neon. Un cuerpo cambiado tras firmar, una clave que Neon no publica o una entrega de hace más de 5 minutos se rechazan.

```ts
it('refuses a replay older than five minutes', async () => {
  const old = String(NOW - 6 * 60_000);
  await expect(verifyNeonWebhook(RESET, headers(RESET, old), keys, NOW)).rejects.toThrow();
});
```

## Email (`mail/shop-mail.spec.ts`)

Un mailer falso recoge cada mensaje. Si falla, el pedido sigue y el error queda en el log.

```ts
it('never fails the order when the email cannot go out, and says why in the log', async () => {
  mailer.failing = true;
  await expect(mail.orderPlaced(ORDER, null)).resolves.toBeUndefined();
  expect(reported).toHaveLength(1);
});
```

## Migraciones (`shop/shop-migration.spec.ts`)

Lee `db/migrations/*.sql` como texto. Si un cambio diera escritura a `anonymous`, moviera el rol a una columna editable o añadiera un campo de tarjeta, el test falla antes de que la migración llegue a una rama de Neon.

```ts
expect(sql).not.toMatch(/grant\s+(insert|update|delete|all)[^;]*\bto\s+anonymous/i);
expect(sql).toContain('client_id = (select auth.uid())');
expect(sql).not.toContain('card_number');
```
