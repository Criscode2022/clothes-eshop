---
title: Decisiones de producto y tech
---

# Decisiones

## SSR solo donde la página es igual para todos

El catálogo, las fichas y el atelier se renderizan en el servidor: llegan pintados, se indexan y el primer pantallazo no espera a JavaScript. El checkout, la cuenta, el panel de tienda y el backoffice dependen de la bolsa del navegador o de quién ha iniciado sesión, así que se renderizan en el navegador. Un servidor que no ve `localStorage` no puede pintarlos bien.

## Un servidor Node propio, no un BaaS desde el navegador

Los pedidos de invitado tienen que guardarse sin que el navegador pueda escribir en la base de datos. Con el Data API, eso obliga a dar permiso de escritura a `anonymous`. Con un servidor que escribe con su propia credencial, `anonymous` se queda en solo lectura y las reglas (stock, dirección, recorridos, quién cancela) se aplican en un único sitio. El mismo proceso sirve el SSR, así que no hay un segundo deploy.

## Sin tarjetas

La tienda registra cómo se va a pagar y nunca pide ni guarda un número de tarjeta: no hay proveedor de pagos, ni PCI, ni formulario que proteger. La transferencia se paga en un banco simulado con un enlace firmado, para que el recorrido Pago pendiente → Pagado sea real sin dinero real.

## El rol en `app_private`, no en el perfil

Si el rol fuera una columna del perfil, cualquiera con permiso para editar su perfil podría hacerse administrador. `app_private.user_roles` no tiene permisos para nadie de la app y se lee con una función `security definer`. El rol se da en SQL.

## Una sesión firmada de la propia tienda

El token lleva persona, rol y caducidad, firmados con una clave que todos los procesos derivan de `DATABASE_URL`. Cualquier proceso valida una petición sin llamar a la red, y la sesión sobrevive a reinicios y deploys. Se guarda en `localStorage` y viaja en una cabecera, que el navegador nunca envía solo, así que no hace falta protección CSRF. El coste, documentado en `SESSIONS.md`: un token no se revoca antes de sus 12 horas.

## Neon Auth por el dominio de la tienda

Safari, cualquier navegador de iPhone, Brave y las ventanas privadas no podían iniciar sesión con la cookie en el dominio de Neon. El relay en `/api/auth` la convierte en cookie propia sin guardar nada de lo que pasa.

## Precios en céntimos enteros

`$420.00` es `42000`. Las sumas son exactas y el formato se decide solo al enseñarlo.

## Una colección corta, sin urgencia inventada

No hay drops, ni "últimas unidades" falsas, ni reseñas, ni cifras de clientes. El stock real sí se enseña ("Quedan 2"). `PRODUCT.md` lista lo que no se puede inventar: reseñas, testimonios, prensa, horario, fotos con modelos, promesas de sostenibilidad.

## El estándar de la categoría, bien hecho

Se eligió el lenguaje de una tienda de lujo discreto, con COS, Arket y Toteme como listón, en lugar de un concepto original. Página blanca, negra y gris; solo las fotos llevan color. Una sola tipografía (Archivo, con su eje de anchura), esquinas rectas y ninguna sombra salvo el aviso de la bolsa. Todo está en `DESIGN.md`.

## Spartan para el comportamiento, no para el aspecto

Spartan aporta foco, teclado y estructura de diálogos, combobox, acordeones y paneles. Su aspecto se ata a los tokens de Marlow (`--radius: 0`, `--primary` es la marca) y los ficheros de `ui/helm/` se quedan como los genera su CLI, para poder actualizarlos.

## La bolsa no tiene página

Abrir la bolsa en un panel lateral evita sacar al cliente de lo que estaba mirando. Una dirección antigua `/bag` lleva a la portada.

## Cancelar un pedido de invitado no se hace online

Las referencias van en secuencia y un invitado no tiene cuenta que pruebe de quién es el pedido. Cancelar con solo la referencia dejaría a cualquiera cancelar pedidos ajenos, así que la página pide dar la referencia en la tienda.
