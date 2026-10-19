---
title: Testing · unitarios
---

# Testing · unitarios

Funciones y clases sin TestBed, sin HTTP y sin base de datos. 16 ficheros, 114 tests.

| Fichero                                           | Tests | Cubre                                                                                                                     |
| ------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------- |
| `shop/address-rules.spec.ts`                      | 15    | Nombre, email, teléfono, calle y ciudad; formato postal y región por país                                                 |
| `shop/shop-cloth.spec.ts`                         | 11    | Tejido y cuidados, fotos por color (y sus dos ficheros en disco), prendas relacionadas, filas de Neon a prendas y pedidos |
| `shop/shop-floor.spec.ts`                         | 9     | Estados de stock, tallas por color, agotado, envío gratis, dólares a céntimos, bolsa guardada                             |
| `shop/fulfillment.spec.ts`                        | 7     | Recorridos de envío y recogida, la frase de cada paso, qué se puede cancelar                                              |
| `shop/order-list.spec.ts`                         | 7     | Buscar y ordenar los pedidos del cliente desde la URL                                                                     |
| `shop/session-seal.spec.ts`                       | 6     | Firmar, leer, caducar y rechazar tokens                                                                                   |
| `i18n/i18n.spec.ts`                               | 6     | Idioma del navegador frente a la elección guardada, frases sin traducción y sus marcadores                                |
| `mail/shop-emails.spec.ts`                        | 19    | Cada plantilla de email, en inglés y en español                                                                           |
| `ui/slide-show.spec.ts`, `ui/slide-track.spec.ts` | 13    | Turnos del carrusel, pausa, movimiento reducido, seguimiento del deslizamiento                                            |
| `stale-build.spec.ts`                             | 5     | Recargar una vez cuando falta el script de un build anterior                                                              |
| `layout/site-header/header-tuck.spec.ts`          | 5     | La cabecera que se esconde al bajar y vuelve al subir                                                                     |
| Otros                                             | 11    | Cola del panel de tienda, cliente de Neon Auth, mailer, ficheros estáticos                                                |

## Recorridos (`shop/fulfillment.spec.ts`)

Un envío y una recogida comparten los dos primeros pasos y terminan distinto. Un pedido cancelado no tiene recorrido, solo su nombre.

```ts
it('follows a shipped order from the shop to the door', () => {
  expect(labels(shipped('placed'))).toEqual([
    'Order placed',
    'Being prepared',
    'On its way',
    'Delivered',
  ]);
  expect(statuses(shipped('shipped'))).toEqual(['done', 'done', 'current', 'upcoming']);
});

it('has no track for a cancelled order, only its name', () => {
  expect(fulfillmentTrack(shipped('cancelled'))).toEqual([]);
  expect(fulfillmentName('cancelled')).toBe('Cancelled');
});
```

## Direcciones (`shop/address-rules.spec.ts`)

Una tabla de casos por país. Las mismas funciones validan el formulario y el pedido en el servidor.

```ts
const cases: [string, string, boolean][] = [
  ['United States', '02903', true],
  ['United States', '2903', false],
  ['Spain', '28013', true],
  ['Spain', '53001', false],
  ['Canada', 'K1A 0B1', true],
  ['Canada', 'D1A 0B1', false],
  ['United Kingdom', 'SW1A 1AA', true],
  ['Portugal', '1100-148', true],
  // …
];
```

## Sesión firmada (`shop/session-seal.spec.ts`)

Un token firmado por un proceso lo lee otro con la misma clave, como tras un reinicio. Otra clave, un payload cambiado a mano o un token de las cuentas compartidas retiradas no valen.

```ts
it('is read by any server that shares the key, as after a restart', () => {
  const token = sealAt(() => NOW).issue(ADA);
  expect(sealAt(() => NOW).read(token)).toEqual(ADA);
});

it('is refused by a server with another key', () => {
  const token = sealAt(() => NOW).issue(ADA);
  expect(sealAt(() => NOW, 'postgres://another-secret').read(token)).toBeNull();
});
```

## Build antiguo (`stale-build.spec.ts`)

```ts
it('loads the page in full when its script belongs to a build the server replaced', async () => {
  const router = openShop(() => Promise.reject(CHROME_MISSING_SCRIPT));
  await goTo(router, '/checkout?from=bag');
  expect(fullLoads).toEqual(['/checkout?from=bag']);
});

it('does not reload in a loop when the full load meets the same failure', async () => {
  const router = openShop(() => Promise.reject(CHROME_MISSING_SCRIPT));
  await goTo(router, '/checkout');
  await goTo(router, '/checkout');
  expect(fullLoads).toEqual(['/checkout']);
});
```

El mismo fichero comprueba que reconoce el error de script ausente en Chrome, Firefox y Safari, que tienen mensajes distintos.
