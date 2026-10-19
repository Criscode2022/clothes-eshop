---
title: Retos y resultados
---

# Retos y aprendizajes

## Iniciar sesión en Safari y en el iPhone

La entrada en Neon Auth respondía 200 y la comprobación siguiente, 401: Safari, todo navegador de iOS, Brave y las ventanas privadas rechazaban la cookie puesta por el dominio de Neon. Se resolvió haciendo pasar Neon Auth por `/api/auth` en la propia tienda y reescribiendo la cookie como propia (`relayNeonAuth`).

## Sesiones que sobreviven a un deploy

Cada deploy arranca un proceso nuevo que no comparte memoria con el anterior, así que una sesión guardada en el servidor se perdía. La sesión pasó a ser un token firmado con una clave derivada de `DATABASE_URL` (HKDF): cualquier proceso lo valida, y el nombre y el rol viajan dentro.

## Pestañas abiertas durante un deploy

Netlify solo guarda los scripts del build nuevo, y una pestaña antigua fallaba al navegar. El router recarga esa página completa una vez (`reloadStaleBuild`), y el servidor responde 404 a un fichero que no existe en lugar de devolver el HTML de la portada, que escondía el error.

## Hidratación con una bolsa en `localStorage`

El servidor no ve la bolsa. Restaurarla durante el render rompía la hidratación, así que se restaura después del primer render y se limita al stock actual, por si alguien compró la última talla entretanto.

## Direcciones de 41 países

Cada país tiene su formato postal, su nombre para el campo (ZIP code, Postcode, Eircode, CEP) y, en ocho de ellos, un estado o provincia obligatorio. Las mismas reglas validan el formulario y el pedido en el servidor. La lista de países no puede entrar en el bundle inicial, así que `checkout.ts`, que importa la bolsa, no importa las reglas de dirección.

## El bundle inicial bajo presupuesto

El panel de la bolsa y el menú del móvil se cargan con `@defer` (en reposo, o en cuanto se piden), para dejar fuera del primer pantallazo el overlay del CDK y tailwind-merge. El SDK de Neon Auth se importa solo cuando alguien inicia sesión. Las fechas se formatean con `Intl.DateTimeFormat` porque `DatePipe` acababa en el bundle inicial incluso desde una página diferida. El carrusel del móvil está hecho a mano sobre scroll snap, sin Embla.

## Fotos más ligeras

Las fotos pasaron de JPEG a AVIF a calidad 65 (60 alisaba el punto y la sarga de lana): de 1,4 MB a 410 KB en las nueve primeras. Cada foto es un `<picture>` con AVIF, JPEG para navegadores antiguos y `<img [ngSrc]>`, así que la precarga que escribe Angular pide el fichero que verán la mayoría. Un test falla si una foto no tiene sus dos ficheros.

# Resultados

- Tienda en producción en [clothes-eshop.cristiancode.dev](https://clothes-eshop.cristiancode.dev), con SSR en el Mac mini y estáticos en la CDN de Netlify.
- Compra completa como invitado o con cuenta: envío o recogida, tres formas de pago, seguimiento, cancelación y emails en el idioma del pedido.
- Panel de tienda y backoffice separados por rol, con permisos en la base de datos (RLS) y en el servidor.
- Bundle inicial de 493 kB (126 kB transferidos), dentro del presupuesto de 500 kB.
- 264 tests en 36 ficheros, todos en verde, en unos 3 segundos.
- Accesibilidad: en la revisión del rediseño (2026-10-04), axe-core no encontró errores en 21 estados de la tienda, en claro y oscuro, escritorio y móvil.
