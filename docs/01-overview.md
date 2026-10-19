---
title: Visión general
---

# Visión general · Marlow

**Marlow** es una tienda online de ropa ready-to-wear con una colección corta: ocho prendas en cuatro categorías (abrigos, punto, pantalones y camisas). Cada prenda enseña su tejido, cómo se cuida y cómo sienta, junto al precio. Se compra sin abrir cuenta, con envío a casa o recogida en la tienda, y se paga en la tienda, por transferencia o en efectivo al recibir el paquete. La tienda nunca pide una tarjeta.

La misma app tiene dos herramientas internas, cada una protegida por rol:

- **Panel de tienda** (`/desk`), para el personal: pedidos del día por estado y stock disponible.
- **Backoffice** (`/owner`), para la administración: todos los pedidos, precios, tallas y colores con su stock, y prendas nuevas.

Es un solo paquete Angular 22 con SSR. Un servidor Node con Express renderiza el catálogo, sirve la API `/api/*` y guarda todo en Neon Postgres.

## Enlaces

- **Web:** [clothes-eshop.cristiancode.dev](https://clothes-eshop.cristiancode.dev)
- **GitHub:** [Criscode2022/clothes-eshop](https://github.com/Criscode2022/clothes-eshop)
- **Nombre en el código:** `package.json` se llama `angular-neon-agent-template`, la plantilla de la que salió el repo. La marca es **Marlow**.

## Stack

| Capa     | Tecnología                                                                                                     |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| Web      | Angular 22.2 sin Zone.js, Signal Forms, SSR con hidratación                                                    |
| UI       | Tailwind CSS 4 sobre tokens propios, Spartan (Brain + Helm) para comportamiento, Archivo como única tipografía |
| Servidor | Node + Express 5 (`src/server.ts`): SSR, API de la tienda, relay de Neon Auth                                  |
| Auth     | Neon Auth (email y contraseña) y una sesión firmada de la propia tienda                                        |
| Datos    | Neon Postgres con RLS; el servidor lee y escribe con `@neondatabase/serverless`                                |
| Email    | nodemailer por SMTP de Gmail (`src/mail/`)                                                                     |
| Hosting  | Plataforma propia en un Mac mini (proceso Node) y CDN de Netlify para los ficheros estáticos                   |

## En cifras

|                 |                                                                   |
| --------------- | ----------------------------------------------------------------- |
| Prendas         | 8, cada una fotografiada en dos colores (16 fotos en AVIF y JPEG) |
| Países de envío | 41: 8 de América, 18 de Europa y 15 de Asia                       |
| Idiomas         | Inglés y español                                                  |
| Migraciones SQL | 6 (`db/migrations/001` a `006`)                                   |
| Tests           | 264 en 36 ficheros, Vitest, unos 3 segundos                       |

## Cómo leer esta documentación

| Documento                                        | Para                                           |
| ------------------------------------------------ | ---------------------------------------------- |
| [Producto y features](./02-product.md)           | Qué hace la tienda y para quién                |
| [Arquitectura](./03-architecture.md)             | Cómo viaja una petición y dónde vive el estado |
| [Estructura](./04-structure.md)                  | Dónde está cada cosa en el repo                |
| [API](./05-api.md)                               | Las rutas del servidor Node                    |
| [Autenticación](./06-auth.md)                    | Cuentas, roles y las dos sesiones              |
| [Modelo de datos](./07-data-model.md)            | Tablas, RLS y migraciones                      |
| [Deploy](./08-deploy.md)                         | Cómo llega `main` a producción                 |
| [Decisiones](./09-decisions.md)                  | Por qué está hecho así                         |
| [Retos y resultados](./10-challenges-results.md) | Lo que costó y lo que quedó                    |
| [Angular](./11-angular-skill.md)                 | Qué APIs de Angular 22 usa y con qué reglas    |

La parte de testing está en [Testing · visión](./12-testing.md).
