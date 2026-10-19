---
title: API del servidor
---

# API del servidor (Node + Express)

Todas las rutas viven en el mismo proceso que el SSR (`src/server.ts`). Las de la tienda se resuelven en `handleShopHttp` (`src/app/shop/shop-server.ts`) y las de la cuenta en `handleAccountHttp` (`account-server.ts`). Las rutas que piden sesión leen `Authorization: Bearer <token>`, el token firmado de la tienda ([Autenticación](./06-auth.md)).

## Sesión e idioma

| Método | Path                     | Auth                   | Notas                                                                                   |
| ------ | ------------------------ | ---------------------- | --------------------------------------------------------------------------------------- |
| `GET`  | `/api/session`           | Bearer                 | Dice de quién es un token guardado; 401 si ha caducado                                  |
| `POST` | `/api/session/neon`      | JWT de Neon en el body | Canjea el JWT de Neon Auth por el token de la tienda, con el rol de `current_shop_role` |
| `POST` | `/api/language`          | Opcional               | Guarda el idioma para los emails siguientes                                             |
| `*`    | `/api/auth/*`            | Cookie de Neon Auth    | Relay a Neon Auth (`relayNeonAuth`); solo rutas propias de Neon Auth                    |
| `POST` | `/api/neon-auth/webhook` | Firma Ed25519 de Neon  | Neon Auth pide a la tienda que envíe el enlace de contraseña                            |

## Catálogo y pedidos

| Método         | Path                              | Auth           | Notas                                                                                        |
| -------------- | --------------------------------- | -------------- | -------------------------------------------------------------------------------------------- |
| `GET`          | `/api/catalog`                    | Pública        | Prendas, variantes, precios y stock                                                          |
| `POST`         | `/api/orders`                     | Opcional       | Pide como invitado o como cliente; rechaza cualquier campo de tarjeta                        |
| `GET`          | `/api/orders`                     | Bearer         | Los pedidos que esa persona puede ver                                                        |
| `GET`          | `/api/orders/:reference`          | Opcional       | Un pedido; el de un cliente solo lo ve ese cliente o el personal                             |
| `POST`         | `/api/orders/:reference/cancel`   | Bearer         | Cancela y devuelve las prendas al stock; 403 sin sesión, y rechaza el pedido de otro cliente |
| `GET` / `POST` | `/api/transfers/:reference/:code` | Código firmado | Datos de la transferencia; `POST` la paga. 404 si el código no es el del pedido              |

## Personal y administración

| Método | Path                                 | Rol                       | Notas                                                                           |
| ------ | ------------------------------------ | ------------------------- | ------------------------------------------------------------------------------- |
| `POST` | `/api/orders/:reference/fulfillment` | Personal o administración | Avanza el pedido un paso; al salir o estar listo para recoger, email al cliente |
| `POST` | `/api/variants/:id/stock`            | Personal o administración | Fija el stock disponible                                                        |
| `POST` | `/api/products/:id/price`            | Administración            | Precio en céntimos                                                              |
| `POST` | `/api/products/:id/variants`         | Administración            | Talla o color nuevo, con stock                                                  |
| `POST` | `/api/products`                      | Administración            | Prenda nueva: nombre, categoría, precio, resumen, primera variante              |

## Cuenta

| Método   | Path           | Auth                  | Notas                                                                                                                                              |
| -------- | -------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PATCH`  | `/api/account` | Bearer                | Cambia el nombre en `neon_auth.user` y `public.profiles` en una transacción, y devuelve un token con el nombre nuevo                               |
| `DELETE` | `/api/account` | Bearer + JWT reciente | Borra la cuenta si el JWT es de la misma persona y de los últimos 5 minutos; los pedidos se conservan desvinculados. El personal no puede borrarse |

Cambiar o borrar la cuenta necesita `DATABASE_URL`; sin él, el servidor responde 503.

## Errores

| Status | Cuándo                                                                                                                                                          |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 400    | Una regla de la tienda no se cumple (stock, dirección, campo que falta) o el pedido no es visible para quien pregunta. El mensaje es la frase que ve el cliente |
| 401    | La sesión ha caducado, o la firma del webhook no es válida                                                                                                      |
| 403    | La acción es solo del personal o de la administración, o pide iniciar sesión                                                                                    |
| 404    | La ruta no existe, o el enlace de pago no es válido                                                                                                             |
| 500    | La tienda no pudo leer o guardar en Neon                                                                                                                        |
| 502    | Neon Auth no responde al relay                                                                                                                                  |

Un código de pago falso y una referencia que no existe dan el mismo 404, para no confirmar qué pedidos hay: las referencias van en secuencia (`MR-1001`, `MR-1002`…).
