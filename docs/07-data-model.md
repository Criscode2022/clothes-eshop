---
title: Modelo de datos
---

# Modelo de datos

Neon Postgres, con Neon Auth y el Data API activados. Las tablas de la tienda están en `public`; los roles del personal, en un esquema aparte, `app_private`, que nadie puede editar desde la app.

## Tablas

| Tabla                    | Columnas clave                                                                                                           | Notas                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `app_private.user_roles` | `user_id` → `neon_auth.user`, `role` (`owner` / `worker`)                                                                | Sin fila, la cuenta es de cliente                                      |
| `public.profiles`        | `id` → `neon_auth.user`, `display_name`, `locale`                                                                        | Se crea sola al darse de alta (trigger `create_profile_after_sign_up`) |
| `public.products`        | `slug`, `name`, `category`, `price_cents`, `summary`, `composition`, `care`                                              | `price_cents > 0`                                                      |
| `public.variants`        | `product_id`, `slug`, `size`, `color`, `stock`                                                                           | Única por (prenda, talla, color); `stock >= 0`                         |
| `public.orders`          | `reference`, `client_id`, contacto, `delivery`, dirección, totales, `payment_method`, `fulfillment`, `paid_at`, `locale` | `client_id` es `null` en un pedido de invitado o de una cuenta borrada |
| `public.order_lines`     | `order_id`, `product_name`, `size`, `color`, `quantity`, `unit_price_cents`, `line_cents`                                | Copia nombre y precio del momento de la compra                         |

Los importes son céntimos enteros de dólar: `subtotal_cents + shipping_cents = total_cents`.

## Restricciones del pedido

```sql
-- Un pedido se envía o se recoge; si se recoge no guarda dirección.
delivery text not null default 'ship' check (delivery in ('ship', 'pickup'))

-- Cada entrega tiene sus propios estados.
check (
  fulfillment in ('placed', 'preparing', 'cancelled')
  or (delivery = 'ship'   and fulfillment in ('shipped', 'delivered'))
  or (delivery = 'pickup' and fulfillment in ('ready', 'picked-up'))
)

payment_method in ('shop-floor', 'bank-transfer', 'cash-on-delivery')
```

## Seguridad (RLS)

Todas las tablas de `public` tienen row level security. Los permisos del Data API son:

| Rol de Neon                | Puede                                                                |
| -------------------------- | -------------------------------------------------------------------- |
| `anonymous`                | Leer `products` y `variants`. Nada más: ningún permiso de escritura  |
| `authenticated` (cliente)  | Leer y editar su perfil; leer sus pedidos (`client_id = auth.uid()`) |
| `authenticated` + `worker` | Además, leer todos los pedidos, cambiar `fulfillment` y el `stock`   |
| `authenticated` + `owner`  | Además, crear y editar prendas y variantes, y cambiar precios        |

`app_private.has_role()` es `security definer` con `search_path = ''`, y las funciones `set_product_price` y `set_variant_stock` lanzan "Only the owner can change a price" o "Only shop staff can change stock" si el rol no alcanza.

En producción el servidor Node escribe con la cadena de conexión del propietario de las tablas: es quien guarda los pedidos de invitado, porque `anonymous` no tiene permiso de escritura. La RLS protege el Data API, que es lo único a lo que el navegador podría llegar.

## Funciones

| Función                                   | Devuelve                     | Para                                                            |
| ----------------------------------------- | ---------------------------- | --------------------------------------------------------------- |
| `public.current_shop_role()`              | `owner`, `worker` o `client` | El servidor la llama con el JWT de la persona al iniciar sesión |
| `app_private.has_role(role)`              | `boolean`                    | Las políticas RLS                                               |
| `public.set_product_price(uuid, integer)` | —                            | Cambio de precio solo para administración                       |
| `public.set_variant_stock(uuid, integer)` | —                            | Cambio de stock para personal y administración                  |

## Migraciones

| Fichero                        | Añade                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------- |
| `001_marlow_shop.sql`          | Esquema, roles, RLS, funciones y las ocho prendas sembradas                      |
| `002_marlow_cloth.sql`         | `slug` en prendas y variantes, `composition` y `care`, y las tallas que faltaban |
| `003_marlow_transfer_paid.sql` | `orders.paid_at`                                                                 |
| `004_marlow_ship_region.sql`   | `orders.ship_region`                                                             |
| `005_marlow_pickup.sql`        | `orders.delivery`, dirección opcional y los estados nuevos de entrega            |
| `006_marlow_locale.sql`        | `profiles.locale` y `orders.locale` (`en` o `es`; inglés en filas antiguas)      |

Cada migración se aplica antes de desplegar el código que la lee. `shop-migration.spec.ts` lee los ficheros SQL como texto: falla si `001` da escritura a `anonymous`, si aparece una columna de tarjeta o si falta una prenda sembrada con su precio.
