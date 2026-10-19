---
title: Testing · flujos completos
---

# Testing · flujos completos

Marlow no tiene Playwright. Los recorridos de punta a punta se prueban con la app entera en TestBed: las rutas reales de `app.routes.ts`, el shell, los guards y las páginas, sobre jsdom. Las llamadas a `/api/*` no se simulan: un interceptor las pasa a `handleShopHttp`, el mismo código del servidor, con el libro de la tienda en memoria. 9 ficheros, 81 tests.

```ts
const shopApiInterceptor: HttpInterceptorFn = (req, next) => {
  const url = new URL(req.url, 'http://marlow.test');
  if (!url.pathname.startsWith('/api/')) {
    return next(req);
  }
  const result = handleShopHttp(
    req.method,
    url.pathname,
    req.body,
    req.headers.get('Authorization'),
  );
  // ≥ 400 → HttpErrorResponse; si no, HttpResponse con result.body
};
```

| Fichero                               | Tests | Cubre                                                                                                                                               |
| ------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shop/shop-routes.spec.ts`            | 33    | Compra, checkout, color y talla, foto a pantalla completa, cancelación, transferencia, panel de tienda, permisos                                    |
| `pages/account/account-pages.spec.ts` | 16    | Entrar con Neon Auth, cambiar nombre y contraseña, borrar la cuenta, recuperar la contraseña, retomar o renovar la sesión                           |
| `layout/shell.spec.ts`                | 11    | Landmarks, enlace de salto, foco tras navegar, la bolsa que se abre y se cierra, el aviso de página lenta                                           |
| `app.spec.ts`                         | 5     | La portada con las 8 prendas y sus precios, qué fotos se cargan con la página, una categoría con su nota de corte, una URL desconocida vuelve a `/` |
| `shop/bag.spec.ts`                    | 4     | El panel se abre en la línea añadida; la bolsa se guarda y se restaura                                                                              |
| Otros                                 | 12    | Carrusel de entrada, lupa de foto, revelado al hacer scroll, botones de la tienda                                                                   |

## Compra como invitado

```ts
it('lets a guest reach confirmation without signing in', async () => {
  const { fixture } = await render('/product/oxford-shirt');
  await choose(fixture, 'input[name="size"][value="S"]');
  await clickButton(fixture, 'Add to bag');
  expect(document.body.textContent).toContain('Added Oxford Cloth Shirt, White S.');

  await go(fixture, '/checkout');
  await typeInto(fixture, 'contact-name', 'Ada Lovelace');
  await typeInto(fixture, 'contact-email', 'ada@example.com');
  await typeInto(fixture, 'contact-phone', '5550148');
  await typeInto(fixture, 'ship-line1', '12 Loom Street');
  await typeInto(fixture, 'ship-city', 'Providence');
  await pick(fixture, 'ship-region', 'Rhode Island');
  await typeInto(fixture, 'ship-postal', '02903');
  await choose(fixture, 'input[value="bank-transfer"]');
  await clickButton(fixture, 'Place order');

  expect(TestBed.inject(Router).url).toBe('/order/MR-1001');
  expect(document.body.textContent).toContain('Your order is placed.');
  expect(document.body.textContent).toContain('Providence, Rhode Island 02903');
});
```

## Permisos por rol

El mismo test pasa por un visitante, un cliente, el personal y la administración, y comprueba qué abre cada uno.

```ts
it('refuses clients at both staff areas and workers at the backoffice', async () => {
  const { fixture } = await render('/owner');
  expect(document.body.textContent).toContain('closed to you');

  adopt(fixture, AVERY); // cliente
  await go(fixture, '/desk');
  expect(document.body.textContent).toContain('closed to you');

  adopt(fixture, JORDAN); // personal
  await go(fixture, '/owner/pieces');
  expect(document.body.textContent).toContain('closed to you');
  await go(fixture, '/desk/stock');
  expect(document.getElementById('piece-price')).toBeNull();

  adopt(fixture, SLOAN); // administración
  await go(fixture, '/owner/pieces');
  expect(document.getElementById('piece-price')).not.toBeNull();
});
```

## Otros recorridos del fichero

- Recoger en tienda, gratis y pagando allí; cambiar entre envío y recogida sin perder la dirección escrita.
- Un campo muestra su error al salir de él; el checkout incompleto conserva lo escrito y señala lo que falta.
- La dirección se adapta al país: estado en Estados Unidos, formato español en España.
- Elegir color en la tarjeta cambia la foto y abre la ficha en ese color.
- La ficha pide una talla en lugar de adivinarla.
- El cliente cancela su pedido tras confirmar; al invitado se le dice que lo pida en la tienda.
- La transferencia aparece pendiente, se paga en el banco simulado y pasa a Pagado.
- Un pedido para recoger avanza por sus propios pasos en el panel de tienda.
- Back vuelve por el historial si se vino desde la tienda, y a un sitio sensato si la página se abrió desde fuera.

## Lo que no cubren

jsdom no pinta: no hay layout, ni `showModal()` (`ui/dialog.ts` usa el atributo `open` como reserva), ni View Transitions. El aspecto, el móvil y la accesibilidad se revisaron con Chrome headless y axe-core durante el trabajo (escritorio y móvil, claro y oscuro), con scripts que no están en el repo.
