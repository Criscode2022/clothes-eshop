---
title: Producto y features
---

# Producto y features

## Problema

En una tienda de ropa pequeña, la ficha de producto suele quedarse en una foto y un precio. El tejido, cómo se lava y cómo sienta aparecen tarde o no aparecen, y son justo lo que decide una compra de 89 a 420 dólares. Comprar suele exigir una cuenta, y en el móvil el camino hasta pagar se alarga en varias pantallas. Detrás, quien prepara los pedidos y quien fija los precios trabajan en la misma web que el cliente o en una hoja de cálculo aparte.

## Solución

Cada prenda se enseña con una foto grande y, al lado del precio, su composición, sus cuidados y su corte. Una talla se añade desde la propia tarjeta del catálogo, la bolsa se abre en un panel lateral sobre la página y el checkout cabe en una sola página que enseña el total antes de pedir. El personal y la administración tienen sus propias pantallas, separadas de la tienda y protegidas por rol.

## Para quién

| Persona            | Qué hace                                                                  | Dónde                                               |
| ------------------ | ------------------------------------------------------------------------- | --------------------------------------------------- |
| Cliente            | Mira la colección, elige color y talla, compra como invitado o con cuenta | `/`, `/category/:slug`, `/product/:id`, `/checkout` |
| Personal de tienda | Mueve pedidos paso a paso y corrige el stock                              | `/desk`, `/desk/stock`                              |
| Administración     | Ve todos los pedidos, fija precios, añade tallas, colores y prendas       | `/owner`, `/owner/pieces`, `/owner/new`             |

## Características

### Ficha con tejido, cuidados y corte

Cada prenda sembrada tiene composición, cuidados y nota de corte en `src/app/shop/cloth.ts`. La ficha los deja junto a la foto, en desplegables. La foto se abre a pantalla completa con un clic o desde el teclado.

### El color cambia la foto

Elegir un color en la tarjeta o en la ficha cambia la fotografía por la de ese color. La bolsa, el checkout, el pedido y el panel de tienda enseñan cada línea en su color. Un color sin foto muestra un panel neutro, nunca la foto de otro color.

### Añadir rápido y bolsa lateral

El botón "+" de una tarjeta abre sus tallas; elegir una la añade sin salir de la página y abre la bolsa en la línea recién añadida. La bolsa no tiene página propia: vive en el panel lateral y se guarda en `localStorage` (`marlow.bag`), limitada al stock real cuando vuelve.

### Checkout en una página

Contacto, entrega y pago en una sola página, con el resumen siempre a la vista. Cada campo se valida al salir de él. La dirección se adapta al país: 41 países, con estado o provincia donde hace falta y el formato postal de cada uno (Canadá `K1A 0B1`, Reino Unido, Irlanda con Eircode, España de 01 a 52 más tres dígitos). El servidor aplica las mismas reglas, así que un pedido enviado por fuera del formulario recibe el mismo error.

### Envío o recogida en tienda

El envío cuesta 8 dólares y es gratis desde 200. La recogida en tienda no paga envío ni guarda dirección. Cada forma tiene su propio recorrido:

| Entrega  | Estados                                                       |
| -------- | ------------------------------------------------------------- |
| Envío    | Pedido hecho → En preparación → En camino → Entregado         |
| Recogida | Pedido hecho → En preparación → Listo para recoger → Recogido |

### Tres formas de pago, sin tarjeta

Pagar en la tienda (solo si se recoge), transferencia o efectivo al llegar (solo si se envía). La transferencia se paga en un banco simulado, **Sandbox Bank**: el email del pedido trae un enlace firmado a `/bank/<referencia>/<código>` y, al "enviar" la transferencia, el pedido pasa a Pagado.

### Invitado o cuenta

Comprar no pide cuenta. Con cuenta de Neon Auth, el cliente ve sus pedidos en `/account/orders`, los busca por referencia y los ordena por fecha o importe desde la propia URL. En `/account` cambia su nombre y su contraseña o borra la cuenta; sus pedidos se conservan, desvinculados.

### Seguimiento y cancelación

La página del pedido enseña su recorrido y una frase con lo que significa el paso actual. El cliente cancela su pedido hasta que sale de la tienda (o hasta que lo recoge), y las prendas vuelven al catálogo. Un pedido de invitado se cancela pidiéndolo en la tienda, porque no hay cuenta que pruebe de quién es.

### Panel de tienda

Pedidos por estado con contadores, búsqueda por referencia o nombre, lista de preparación (líneas, entrega y contacto) y un botón para el siguiente paso. Una columna dice cómo sale cada pedido: la ciudad, o "En el mostrador". El stock se corrige en línea.

### Backoffice

Todos los pedidos, el precio de cada prenda en dólares (guardado en céntimos), tallas y colores nuevos con su stock, y prendas nuevas. Una prenda nueva no tiene foto hasta que se le pone una, y todas las vistas funcionan sin ella.

### Emails

Confirmación del pedido, aviso cuando el paquete sale o el pedido está listo para recoger, bienvenida al abrir cuenta y enlace para cambiar la contraseña. Cada uno sale en el idioma guardado para ese pedido o esa cuenta.

### Inglés y español

El idioma sigue al navegador (español si su primer idioma lo es) o a lo que el cliente elija en la cabecera, que se guarda en la cookie `marlow.lang`. Los precios siempre se muestran en dólares, `$420.00`.

### Accesibilidad

WCAG 2.2 AA y axe sin errores en todas las pantallas: foco visible, foco en el contenido nuevo tras navegar, contraste AA en tema claro y oscuro, y movimiento reducido respetado. El carrusel del móvil tiene botón de pausa (WCAG 2.2.2).
