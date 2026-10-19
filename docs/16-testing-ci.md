---
title: Testing · CI
---

# Testing · CI

No hay `.github/workflows` en el repo. Lo que corre solo en cada push a `main` es el build de la plataforma de hosting, y ese build no lanza los tests.

## Qué para un deploy hoy

| Puerta     | Dónde                        | Qué para                                                                  |
| ---------- | ---------------------------- | ------------------------------------------------------------------------- |
| `npm ci`   | Plataforma de hosting        | Un `package-lock.json` desfasado                                          |
| `ng build` | Plataforma de hosting        | Un error de TypeScript o de plantilla, o un bundle inicial de más de 1 MB |
| `npm test` | A mano, antes de cada commit | Un cambio que rompe un comportamiento probado                             |

`PROJECT.md` define cuándo un cambio está terminado: el build pasa, los tests pasan e incluyen el comportamiento cambiado, las rutas SSR responden con HTML renderizado, `npm run test:scripts` pasa si cambió `scripts/`, y no hay secretos en ficheros versionados. Hoy esa regla la cumple quien hace el commit, no una máquina.

## Qué haría un workflow

La suite no necesita servicios: sin `DATABASE_URL`, la tienda vive en memoria. Un job bastaría:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 24
    cache: npm
- run: npm ci
- run: npm test -- --watch=false
- run: npm run test:scripts
- run: npm run build
```

Ningún secreto haría falta en GitHub. Tampoco Chromium, porque los flujos completos corren en jsdom.
