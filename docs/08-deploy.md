---
title: Deploy
---

# Deploy

Marlow no está en Vercel ni en un Netlify con funciones. Lo publica la plataforma de hosting propia, que corre en un Mac mini, y Netlify solo pone el nombre público y la CDN.

## De un push a producción

1. Un push a `main` llega a la plataforma, que tiene el repo clonado en el Mac mini.
2. La plataforma instala (`npm ci`) y construye (`npm run build`). Si el bundle inicial pasa de 1 MB, Angular corta el build y el deploy no sale.
3. Arranca `dist/angular-neon-agent-template/server/server.mjs` como proceso en un puerto local.
4. Sube los ficheros de `browser/` al sitio de Netlify `hp-clothes-eshop`. Los que llevan hash en el nombre se cachean un año.
5. El resto de rutas (páginas y `/api`) se reescribe, sin forzar, hacia Tailscale Funnel y de ahí al proceso del Mac. Un fichero que existe en la CDN gana siempre a la reescritura, así que un script nunca espera al Mac.

```
https://clothes-eshop.cristiancode.dev
    │
    ├─ /chunk-*.js, /styles-*.css, /garments/*  ──► CDN de Netlify
    └─ /, /product/…, /api/…  ──► Funnel ──► Mac mini ──► server.mjs
```

La plataforma no lanza los tests: el build es la única puerta automática ([Testing · CI](./16-testing-ci.md)).

## Variables

Se definen en la plataforma (producción) o en el `.env` local, que está en `.gitignore`. Ninguna puede aparecer en un fichero versionado.

| Variable                           | Para                                                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                     | Neon. Secreto. Sin ella la tienda vive en memoria y no se puede cambiar ni borrar una cuenta                             |
| `SHOP_URL`                         | Adónde apuntan los enlaces de los emails: `https://clothes-eshop.cristiancode.dev`                                       |
| `NG_ALLOWED_HOSTS`                 | Hosts que acepta el SSR. En producción `127.0.0.1,localhost`, porque las peticiones llegan por el proxy local; nunca `*` |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Envío por Gmail. La contraseña de aplicación es secreta                                                                  |
| `MAIL_FROM`                        | Remitente opcional, por ejemplo `Marlow <shop@gmail.com>`                                                                |
| `MAIL_OUTBOX`                      | Carpeta opcional donde escribir los emails en desarrollo                                                                 |

Sin Gmail configurado, cada email se escribe como HTML en `tmp/mail-outbox/`.

## Una vez por rama de Neon

- **Migraciones:** aplicar en orden `db/migrations/001` a `006`, cada una antes del código que la lee.
- **Webhook de Neon Auth:** Neon Console → Auth → Configuration → Webhooks, URL `https://<host>/api/neon-auth/webhook`, evento `send.magic_link`, timeout 5 s. Neon no acepta `localhost`.
- **Dominios de confianza:** añadir el origen de producción en Neon Auth, o el enlace de contraseña no puede volver a la tienda.

## Una pestaña abierta durante un deploy

Cada deploy cambia el nombre de los scripts y Netlify solo guarda los nuevos. Una pestaña abierta antes falla al pedir el script de la página siguiente. `reloadStaleBuild` (`src/app/stale-build.ts`, el manejador de errores de navegación del router) carga entonces esa dirección completa, que trae el build nuevo; la bolsa y la sesión siguen en `localStorage`. Recarga una sola vez por página en 10 segundos, para no entrar en bucle si el script falta de verdad. El servidor responde 404 a cualquier ruta con extensión que no exista, nunca el HTML de la portada.

## En local

```bash
npm install
npm start                    # :4200, SSR en desarrollo; lee .env
npm run build
NG_ALLOWED_HOSTS=localhost npm run serve:ssr:angular-neon-agent-template   # :4000
```

Con `DATABASE_URL` en `.env`, el servidor de desarrollo lee y escribe en esa rama de Neon. Para probar sin tocar datos, arrancar con `DATABASE_URL=` vacío.
