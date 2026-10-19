---
title: Arquitectura
---

# Arquitectura

## Diagrama lógico

```
Navegador (Angular 22, hidratado)
    │  catálogo, ficha, atelier: HTML renderizado en el servidor
    │  bolsa y sesión de la tienda: localStorage
    │  /api/*        API de la tienda (Bearer <token de la tienda>)
    │  /api/auth/*   Neon Auth, a través del propio dominio
    ▼
Netlify (sitio hp-clothes-eshop)
    │  ficheros de browser/ desde la CDN (con hash, caché de un año)
    │  el resto ──► Tailscale Funnel ──► Mac mini
    ▼
Node + Express (src/server.ts)
    ├─ SSR de Angular (AngularNodeAppEngine)
    ├─ API de la tienda (handleShopHttp, handleAccountHttp)
    ├─ relay de Neon Auth (relayNeonAuth)
    ├─ webhook de Neon Auth (/api/neon-auth/webhook)
    └─ ShopMail ──► Gmail SMTP
         │
         ▼
Neon: Postgres (public + app_private) · Neon Auth · Data API (rpc/current_shop_role)
```

## Qué se renderiza dónde

`src/app/app.routes.server.ts` decide el modo de cada ruta:

| Modo      | Rutas                                                                                    | Por qué                                                                   |
| --------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Servidor  | `/`, `/category/:slug`, `/product/:id`, `/atelier`                                       | Son públicas e iguales para todos: llegan pintadas y con buen SEO         |
| Navegador | `/checkout`, `/order/:reference`, `/sign-in`, `/account`, `/desk`, `/owner`, `/bank/...` | Dependen de la bolsa del navegador o de la persona que ha iniciado sesión |

El servidor no ve `localStorage`, así que la bolsa se restaura después del primer render: la hidratación coincide con el HTML del servidor y la bolsa aparece justo después.

## El libro de la tienda

El estado de la tienda (prendas, variantes, pedidos) vive en un objeto en memoria, el libro (`src/app/shop/order-book.ts`), compartido por el proceso. Con `DATABASE_URL` definido:

1. Antes de cada página o petición a la API (salvo leer la sesión), `pullNeon()` carga el libro desde Neon.
2. La regla de negocio se aplica sobre el libro (`handleShopHttp`).
3. Si la petición escribió algo y salió bien, `pushNeon()` lo guarda en Neon. Si guardar falla, el libro se vuelve a cargar y la petición devuelve el error.

Lecturas y escrituras pasan por una única cola (`enqueue` en `neon-book.ts`), así que dos peticiones nunca intercalan una lectura con una escritura. Sin `DATABASE_URL`, el mismo libro se queda en memoria: es lo que usan los tests y una tienda local.

## Capas

1. **Rutas** — `app.routes.ts` (rutas y guards) y `app.routes.server.ts` (modo de render).
2. **Layout** — `src/app/layout/`: shell, cabecera, menú del móvil, panel de la bolsa, aviso de carga lenta.
3. **UI** — `src/app/ui/`: campos de formulario, tarjeta de prenda, líneas de la bolsa, recorrido del pedido, migas de pan, lupa de foto. `ui/helm/` es Spartan tal como lo genera su CLI.
4. **Páginas** — `src/app/pages/`: catálogo, ficha, checkout, pedido, cuenta, contraseña, panel de tienda, backoffice y banco simulado.
5. **Dominio** — `src/app/shop/`: reglas puras (`cart.ts`, `checkout.ts`, `fulfillment.ts`, `address-rules.ts`, `bank-transfer.ts`, `access.ts`, `money.ts`, `stock.ts`), el libro y su sincronía con Neon.
6. **Servidor** — `src/server.ts`, `shop/shop-server.ts`, `shop/account-server.ts` y `src/mail/`.

## Principios

- **El navegador nunca ve una cadena de conexión.** `DATABASE_URL` solo lo lee el servidor. El rol `anonymous` de Neon solo tiene `SELECT` sobre el catálogo, así que todo pedido, también el de un invitado, lo escribe el servidor.
- **Cada regla vive una vez.** Las reglas de dirección de `address-rules.ts` validan el formulario y también el pedido en el servidor (`assertDeliverable`). Los recorridos de entrega están solo en `fulfillment.ts`.
- **El rol sale de la base de datos.** `app_private.user_roles`, leído con `current_shop_role`; nunca un campo que la persona pueda editar.
- **El email nunca bloquea.** `ShopMail` envía después de guardar el pedido o el inicio de sesión y solo registra el fallo.
- **Los estáticos no esperan al Mac.** Scripts, estilos, fuentes y fotos salen de la CDN de Netlify; solo las páginas y `/api` viajan hasta el proceso.
