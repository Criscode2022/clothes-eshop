---
title: Estructura del proyecto
---

# Estructura (app única)

Marlow no es un monorepo: un solo paquete Angular con su servidor Node dentro (`src/server.ts`). El build produce `dist/angular-neon-agent-template/browser/` (estáticos) y `server/server.mjs` (el proceso).

```
clothes-eshop/
├─ src/
│  ├─ server.ts          Express: SSR, /api, relay y webhook de Neon Auth
│  ├─ static-files.ts    404 para un fichero que el build no tiene
│  ├─ styles.scss        tokens de color y estilos compartidos
│  ├─ tailwind.css       capas de Spartan y tokens para Tailwind 4
│  ├─ mail/              ShopMail, plantillas, mailer y webhook de Neon Auth
│  └─ app/
│     ├─ layout/         shell, cabecera, menú, panel de la bolsa
│     ├─ pages/          una carpeta por pantalla
│     ├─ shop/           dominio, servidor de la tienda y sincronía con Neon
│     ├─ ui/             componentes propios; helm/ es Spartan generado
│     └─ i18n/           inglés como fuente y diccionario español
├─ db/migrations/        001 a 006, en orden
├─ public/garments/      16 fotos, cada una en .avif y .jpg
├─ scripts/              onboarding y actualización desde la plantilla
└─ docs/                 esta documentación
```

## Páginas (`src/app/pages/`)

| Carpeta               | Pantalla                                                                     |
| --------------------- | ---------------------------------------------------------------------------- |
| `catalog`             | Portada (tres fotos de entrada, carrusel en el móvil) y páginas de categoría |
| `product`             | Ficha: foto, color, talla, tejido, cuidados, corte y prendas relacionadas    |
| `checkout`            | Contacto, entrega y pago en una página                                       |
| `order`               | Pedido: recorrido, líneas, totales, pago y cancelación                       |
| `account`             | Cuenta (nombre, contraseña, borrar) y pedidos del cliente                    |
| `sign-in`, `password` | Entrar, crear cuenta, pedir y fijar una contraseña nueva                     |
| `atelier`             | Página editorial: tejidos, envíos y pagos, cómo sale un pedido               |
| `staff`               | Cola de pedidos compartida por el panel de tienda y el backoffice            |
| `desk`                | Panel de tienda y stock                                                      |
| `owner`               | Backoffice: prendas, precios, variantes y prenda nueva                       |
| `bank`                | Sandbox Bank, fuera del shell de la tienda                                   |

## Dominio (`src/app/shop/`)

| Fichero                                                    | Responsabilidad                                                                  |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `catalog.ts`, `cloth.ts`                                   | Las ocho prendas sembradas, sus fotos por color y sus notas de tejido y cuidados |
| `cart.ts`, `bag.ts`, `bag-storage.ts`                      | Líneas, límite de stock y bolsa guardada en `localStorage`                       |
| `checkout.ts`, `money.ts`                                  | Presupuesto del pedido, envío gratis desde 200 dólares, céntimos                 |
| `address-rules.ts`, `countries.ts`, `country-divisions.ts` | Los 41 países, sus regiones y sus formatos postales                              |
| `fulfillment.ts`, `pickup-point.ts`                        | Recorridos de envío y recogida, y el mostrador de recogida                       |
| `bank-transfer.ts`, `transfer-codes.ts`                    | Estado del pago y enlace firmado al banco simulado                               |
| `access.ts`, `staff.guard.ts`                              | Quién puede hacer qué, y los guards de las rutas                                 |
| `order-book.ts`                                            | El libro en memoria y las operaciones de la tienda                               |
| `neon-book.ts`                                             | Cargar y guardar el libro en Neon                                                |
| `shop-server.ts`, `account-server.ts`                      | La API de la tienda y la de la cuenta                                            |
| `session-seal.ts`, `server-key.ts`                         | La sesión firmada de la tienda y su clave                                        |
| `neon-auth.ts`, `neon-auth-relay.ts`, `neon-adopt.ts`      | Cliente de Neon Auth, relay y canje de su JWT                                    |

## Ficheros de contexto

| Fichero                   | Qué guarda                                                          |
| ------------------------- | ------------------------------------------------------------------- |
| `APP.md`                  | Reglas y decisiones de esta app, con fecha. Gana sobre `PROJECT.md` |
| `PRODUCT.md`              | Usuarios, propósito y principios del producto                       |
| `DESIGN.md`               | Sistema visual: tokens, tipografía, componentes                     |
| `SESSIONS.md`             | Cómo funcionan las dos sesiones y por qué                           |
| `PROJECT.md`, `AGENTS.md` | Reglas de la plantilla para agentes                                 |

El repo nació de la plantilla `angular-ai-template` (remoto `template`). `npm run update-from-template` actualiza los ficheros que pertenecen a la plantilla (`AGENTS.md`, `PROJECT.md`, `.agents/skills/`, `scripts/`…) y nunca toca `APP.md`.

## Scripts

| Script                                          | Descripción                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------ |
| `npm start`                                     | `ng serve` en `:4200`, con SSR. Lee `.env`: con `DATABASE_URL` escribe en Neon |
| `npm run build`                                 | Build de producción en `dist/`                                                 |
| `npm run serve:ssr:angular-neon-agent-template` | Sirve el build en `:4000`                                                      |
| `npm test`                                      | Vitest con jsdom (`@angular/build:unit-test`)                                  |
| `npm run test:scripts`                          | `node --test` sobre `scripts/`                                                 |

Package manager: npm 11. Node 22.22.3+, 24.15+ o 26+.
