---
title: Testing · visión
---

# Testing · visión

Marlow tiene **264 tests en 36 ficheros**, todos con Vitest sobre jsdom a través del builder `@angular/build:unit-test`. La suite entera tarda unos 3 segundos y no necesita red ni base de datos: sin `DATABASE_URL`, el libro de la tienda vive en memoria y cada test lo reinicia (`resetShopServer()`).

| Capa                                       | Ficheros | Tests | Qué cubre                                                                                                             |
| ------------------------------------------ | -------- | ----- | --------------------------------------------------------------------------------------------------------------------- |
| [Unitarios](./13-testing-unit.md)          | 16       | 114   | Reglas puras: direcciones, recorridos, sesión firmada, stock, dinero, idioma, plantillas de email                     |
| [Integración](./14-testing-integration.md) | 11       | 69    | La API de la tienda llamada directamente, la cuenta, el webhook de Neon Auth, el envío de email y las migraciones SQL |
| [Flujos completos](./15-testing-e2e.md)    | 9        | 81    | La app entera renderizada con sus rutas reales y la API interceptada hacia el servidor de verdad                      |
| [CI](./16-testing-ci.md)                   | —        | —     | No hay GitHub Actions; el build de la plataforma es la única puerta automática                                        |

## Comandos

```bash
npm test -- --watch=false   # una pasada: los 264 tests
npm test                    # en una terminal, se queda observando cambios
npm run test:scripts        # node --test sobre scripts/ (los 28 tests de la plantilla)
```

## Convenciones

- **El nombre del test es una frase del comportamiento**, escrita como lo diría la tienda: "lets a guest reach confirmation without signing in", "takes no money for a cancelled order".
- **Sin mocks del dominio.** Los tests de rutas no simulan la API: un `HttpInterceptorFn` llama a `handleShopHttp`, el mismo código que corre en el servidor.
- **Lo externo se sustituye en el borde:** un mailer falso que recoge los emails, un directorio de cuentas falso en lugar de Neon, claves Ed25519 generadas en el test para el webhook.
- **El tiempo se controla.** `SessionSeal` y el webhook reciben un reloj, y el carrusel corre con temporizadores falsos de Vitest, así que caducidades y turnos se prueban sin esperar.
- **Personas fijas:** Avery (cliente), Jordan (personal) y Sloan (administración), con sesiones abiertas por `openSession`, como hace el servidor tras Neon Auth.
