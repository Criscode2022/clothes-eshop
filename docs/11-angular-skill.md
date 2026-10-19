---
title: Angular
---

# Angular

Marlow está en **Angular 22.2 + TypeScript 6.0**. A diferencia de Task Cloud, Lista de la compra o Presencia, no lleva Ionic, así que puede usar las APIs de v22 sin techo: no hay `zone.js` en el proyecto y la detección de cambios es zoneless, la opción por defecto de v22.

## Skills del repo

Las reglas para agentes están en `.agents/skills/` (con enlaces en `.claude/skills/`). Las que aplican a Marlow:

| Skill                            | Para                                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------------- |
| `angular-developer`              | Componentes, signals, formularios, rutas y tests en Angular moderno                                 |
| `angular-ssr`                    | El tipo de app (`appType: ssr` en `preferences.json`): render por ruta, hidratación, `allowedHosts` |
| `spartan`                        | Brain y Helm: cómo instalar componentes y cambiar su aspecto sin tocar lo generado                  |
| `tailwind-angular`               | Tailwind 4 sobre tokens, sin `tailwind.config.js`                                                   |
| `neon-auth`, `neon-data-api-rls` | Neon Auth, el Data API y las políticas RLS                                                          |
| `clean-code`                     | Se carga en todo cambio                                                                             |
| `frontend-design`, `impeccable`  | Diseño de interfaz; `impeccable` lee `PRODUCT.md` y `DESIGN.md`                                     |

`AGENTS.md` añade las reglas oficiales de Angular: standalone sin `standalone: true`, OnPush por defecto (no se escribe), `input()` / `output()` / `model()`, control de flujo nativo, `inject()`, `@Service()` para singletons nuevos, bindings en `host`, sin `ngClass` ni `ngStyle`, `NgOptimizedImage` para imágenes estáticas y Signal Forms para formularios nuevos.

## Qué usa de Angular 22

| API                                                                                 | Dónde                                               | Para                                                                                           |
| ----------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Zoneless                                                                            | Todo el proyecto                                    | Sin `zone.js`; los signals avisan a la vista                                                   |
| Signal Forms (`form()`, `FormField`, `required`, `validate`, `applyWhen`, `submit`) | Checkout, entrar, contraseña, backoffice            | Validación al salir del campo; la dirección solo se valida si el pedido se envía (`applyWhen`) |
| `@Service()`                                                                        | `CatalogStore`, `ShopSession`, `BagPersistence`…    | Singletons sin `@Injectable({ providedIn: 'root' })`                                           |
| `linkedSignal`                                                                      | Ficha, tarjeta, stock, backoffice                   | Talla o borrador que se reinicia cuando cambia la prenda                                       |
| `afterRenderEffect` / `afterNextRender`                                             | Shell, cabecera, carrusel, revelado al hacer scroll | Abrir y cerrar diálogos nativos, restaurar la bolsa tras hidratar                              |
| `@defer (on idle; when …)`                                                          | Panel de la bolsa, menú del móvil                   | Sacar el overlay del CDK del bundle inicial; se cargan en reposo o en cuanto se abren          |
| `withViewTransitions`                                                               | Router                                              | La foto pasa del catálogo a la ficha; el primer render no anima                                |
| `withNavigationErrorHandler`                                                        | Router                                              | Recargar la página cuando su script es de un build anterior                                    |
| `withComponentInputBinding`                                                         | Router                                              | Los parámetros de ruta llegan como `input()`                                                   |
| `TransferState`                                                                     | Idioma                                              | El navegador hidrata en el mismo idioma que eligió el servidor                                 |
| `animate.enter` / `animate.leave`                                                   | Líneas de la bolsa, cabecera                        | Entradas y salidas sin `@angular/animations`                                                   |
| `NgOptimizedImage` dentro de `<picture>`                                            | Fotos de prendas                                    | AVIF con JPEG de reserva; la foto principal es `priority`                                      |

## Formularios

Los campos de Signal Forms usan componentes propios (`TextField`, `SelectField`, `CountryField`) en lugar del input de Spartan, porque el de Spartan marca como inválidos los campos obligatorios antes de tocarlos. Los tres toman el error, la pista, `aria-invalid` y `aria-describedby` de `fieldMessages`. El país es el combobox de Spartan (directivas de Brain sobre el input de Marlow), buscable por el nombre en inglés, el nombre propio del país o el código ("españa", "uk", "deutsch").

## Render en el servidor

Las rutas públicas se renderizan en el servidor con `RenderMode.Server`; el resto, con `RenderMode.Client`. En el servidor, `CATALOG_SOURCE` apunta al libro de la tienda ya cargado desde Neon, así que el HTML lleva precios y stock reales. Todo lo que lee `localStorage`, la cookie o la ventana espera al primer render en el navegador.

## Estilo de la casa (extracto)

- Lógica en el `.ts`, plantilla en el `.html` y estilos en el `.scss`; plantillas inline solo en componentes pequeños.
- Estado en `signal` / `computed` / `linkedSignal`; `update` o `set`, nunca `mutate`.
- Colores solo desde los tokens de `src/styles.scss`; una sola tipografía.
- `ShopButtonImports` en lugar de `HlmButton` solo, para que todo botón tenga las alturas de la tienda.
- `ui/helm/` no se edita: el aspecto se cambia en los tokens o en el bloque `data-slot` de `src/styles.scss`.
