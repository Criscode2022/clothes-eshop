---
title: Autenticación
---

# Autenticación

Toda cuenta es una cuenta de **Neon Auth** con email y contraseña. Comprar no la necesita: un pedido de invitado se guarda sin cliente. No hay cuentas compartidas de demo; las cuatro que hubo se retiraron el 2026-10-15 porque su contraseña estaba en la página de entrada.

## Roles

| Rol                      | Abre                                                    | De dónde sale                                         |
| ------------------------ | ------------------------------------------------------- | ----------------------------------------------------- |
| Cliente                  | Su cuenta y sus pedidos                                 | Cualquier cuenta sin fila en `app_private.user_roles` |
| Personal (`worker`)      | `/desk`: pedidos y stock                                | Fila `worker` en `app_private.user_roles`             |
| Administración (`owner`) | `/desk` y `/owner`: además precios, variantes y prendas | Fila `owner` en `app_private.user_roles`              |

El rol se da en SQL y nunca desde la app:

```sql
insert into app_private.user_roles (user_id, role)
select id, 'worker' from neon_auth."user" where email = '<email>';
```

`src/app/shop/access.ts` decide qué puede hacer cada rol, y `staff.guard.ts` cierra las rutas. El personal no puede cambiar precios; un cliente que abre `/desk` ve "Esta parte de la tienda está cerrada para ti".

## Dos sesiones

|            | Sesión de Neon Auth                                      | Sesión de la tienda                                      |
| ---------- | -------------------------------------------------------- | -------------------------------------------------------- |
| La emite   | Neon Auth                                                | El servidor Node                                         |
| Vive en    | Una cookie en el dominio de la tienda                    | `localStorage`, clave `marlow.session`                   |
| Forma      | Cookie de sesión de Neon                                 | `neon_<payload>.<HMAC-SHA256>`: persona, rol y caducidad |
| Dura       | Lo que diga Neon Auth                                    | 12 horas                                                 |
| Sirve para | Entrar, renovar, cambiar la contraseña, borrar la cuenta | Todas las llamadas a `/api/*`                            |

### Entrar

1. El navegador entra en Neon Auth (`signIn.email`), que deja su cookie.
2. Pide a Neon Auth un JWT corto y lo envía a `POST /api/session/neon`.
3. El servidor (`adoptNeonSession` en `neon-adopt.ts`) llama a `rpc/current_shop_role` del Data API con ese JWT. El Data API comprueba la firma; si la rechaza, no hay sesión. El rol sale de esa función, no del JWT.
4. El servidor firma la sesión de la tienda (`SessionSeal`) y el navegador la guarda.

Desde ahí, cada llamada lleva `Authorization: Bearer <token>`. El servidor comprueba prefijo, firma (en tiempo constante) y caducidad sin preguntar a la base de datos ni a Neon.

### La clave

La clave de firma se deriva de `DATABASE_URL` con HKDF (`server-key.ts`). Todos los procesos derivan la misma, así que una sesión sobrevive a un reinicio o a un deploy, y la derivación es de un solo sentido: la clave no revela el secreto. Sin `DATABASE_URL` cada proceso firma con una clave aleatoria.

### Tras recargar o a las 12 horas

Después del primer render, `ShopClient.resumeSession()` pregunta `GET /api/session`, y los guards esperan su respuesta, así que recargar `/desk` o `/owner` no echa a nadie. Si el token ha caducado, el navegador pregunta a Neon Auth por su cookie y canjea un JWT nuevo, como al entrar. Así un rol cambiado o un cierre de sesión en otro dispositivo llega a la tienda en 12 horas como mucho. Un invitado no guarda token y nunca carga el SDK de Neon Auth.

## Neon Auth a través del propio dominio

Safari, cualquier navegador de iPhone o iPad, Brave, las ventanas privadas y todo navegador que bloquee cookies de terceros rechazaban la cookie de Neon Auth puesta en el dominio de Neon: la entrada respondía 200 y la siguiente comprobación, 401. Desde el 2026-10-15 el cliente de Neon Auth apunta a `/api/auth` en la propia tienda. El servidor reenvía esas llamadas con el proxy del SDK (`handleAuthRequest`) y `relayNeonAuth` reescribe la cookie como propia: sin `Domain`, sin particionar, `SameSite=Lax` y `Secure`. Solo reenvía rutas de Neon Auth y no guarda nada de lo que pasa.

## Contraseña y cuenta

- **Olvidé la contraseña:** `/forgot-password` pide a Neon Auth un enlace que vuelve a `/reset-password?token=…`. La página responde igual exista o no la cuenta. Con el webhook `send.magic_link` registrado, Neon llama a `POST /api/neon-auth/webhook` y la tienda envía el enlace por Gmail con su propia plantilla. El servidor comprueba la firma Ed25519 contra las claves publicadas de la rama, rechaza entregas de más de 5 minutos y descarta reintentos ya atendidos.
- **Cambiar la contraseña:** pide la actual y cierra las sesiones de Neon en los demás dispositivos (`revokeOtherSessions`).
- **Borrar la cuenta:** pide la contraseña otra vez; el servidor solo acepta un JWT de la misma persona y de los últimos 5 minutos, así que una pestaña abierta no basta.

## Límite aceptado

Un token firmado no se puede revocar antes de tiempo: una copia hecha antes de cerrar sesión sigue valiendo hasta que caduca. `SESSIONS.md` explica las dos alternativas posibles (leer la cookie de Neon en cada petición, o guardar el token en una cookie `HttpOnly` propia) y por qué ninguna está aplicada.
