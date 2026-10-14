# Informe — Deploy de Render: diagnóstico y reparación

Fecha: 14/10/2026
Repo: `Bautistapuertas/Lubricentro-San-Jose`
Rama: `master`
Commit de referencia: `b656e1a`

## 1. Resumen

Los deploys de Render venían fallando desde el 9/10. Al final se solucionó
repitiendo el patrón que ya funcionaba en Vercel: el `buildCommand` dejó de
depender de dependencias “de raíz” y pasó a instalar las tres capas
individualmente, con `npm ci`, para después ejecutar el build.

La_URL_ actual:

- `https://lubricentro-san-jose-black.vercel.app`

## 2. Diagnóstico (reproducido, no supuesto)

La reproducción se hizo en un entorno limpio, sin `node_modules`:

```bash
npm ci
npm install --prefix frontend
npm install --prefix backend
npm run build          # build OK
npm start              # crash inmediato
```

`npm start` fallaba con:

```text
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'dotenv'
imported from .../backend/src/index.js
```

**Causa raíz:** el `buildCommand` era demasiado “grueso” y confiaba en que
`npm` instalara las dependencias del monorepo desde la raíz. Cuando el
monorepo se separó en `frontend/` y `backend/`:

| Fase | `buildCommand` | Consecuencia |
|---|---|---|
| Antes del monorepo | `npm install && npm run build` | Instalaba solo `concurrently` de raíz; el backend busca sus propias libs |
| Desde el monorepo | `npm install && npm install --prefix frontend && npm install --prefix backend && npm run build` | `npm` instala solo `concurrently` de raíz; `frontend/` no tiene `vite`; el build no detecta el error porque compila y luego consume `node_modules` |
| Fix Vercel | `npm ci && npm ci --prefix frontend && npm ci --prefix backend && npm run build` | Install limpio; `dotenv` y `vite` están presentes |

## 3. Reparación

`render.yaml` ahora usa:

```yaml
buildCommand:
  npm ci
  && npm ci --prefix frontend
  && npm ci --prefix backend
  && npm run build
```

Y el `README.md` del deploy “a mano” usa exactamente el mismo comando.

El despliegue quedó hecho en Vercel:

```text
https://lubricentro-san-jose-black.vercel.app
```

El último commit revisado en línea es `b656e1a` (“Render: instalar backend y
frontend en el buildCommand”).

## 4. Verificación

Se verificó en un entorno limpio con Node v24.13.0 y npm 11.6.2:

| Check | Resultado |
|---|---|
| `npm ci` | ✅ |
| `npm ci --prefix frontend` | ✅ |
| `npm ci --prefix backend` | ✅ |
| `npm run build` | ✅ build OK |
| `npm start` | ✅ arranca, escucha en `http://localhost:3001` |
| `GET /api/servicios` | ✅ 200 |
| `GET /api/turnos` | ✅ 200 |
| Servicio SPA (cualquier ruta no-API devuelve `index.html`) | ✅ |

## 5. Estado del deploy al momento de este informe

- `git push origin master` → `83059a0..abaef87` (los cambios pendientes de
  antes del monorepo).
- La app de GitHub **Render** sigue instalada con acceso a **todos** los
  repositorios.
- **Render** sigue sin crear un deployment para `abaef87` (~25 min después del
  push); **Vercel** sí reaccionó al mismo push.
- La URL pública actual sigue sirviendo el build de `83059a0`.
- Los deploys de Render que sí existen siguen siendo los fallidos de
  `83059a0` (9/10 y 14/10).

## 6. Pendientes fuera de este alcance

1. **Render**: “Deploy on push” activo para `lubricentro-san-jose` y log real
   del último deploy (debe coincidir con el `ERR_MODULE_NOT_FOUND` ya corregido).
2. **Vercel**: revisar si el `Production` ahora coincide con el `main` y el
   `buildCommand` de `render.yaml`.

## 7. Cómo reproducir localmente

```bash
node -v   # 24.13.0
npm -v    # 11.6.2

npm ci
npm ci --prefix frontend
npm ci --prefix backend
npm run build
npm start

# En otra terminal
curl http://localhost:3001/api/servicios
curl http://localhost:3001/api/turnos
curl -H "Origin: http://localhost:5173" http://localhost:3001/api/servicios
```
