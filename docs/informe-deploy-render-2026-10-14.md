# Informe — Deploy de Render: diagnóstico y reparación

Fecha: 14/10/2026 · Repo: `Bautistapuertas/Lubricentro-San-Jose` · Rama: `master`

## 1. Resumen

Los deploys de Render venían fallando desde el 9/10 (los últimos: 14/10 10:59 y 11:11),
así que la URL pública quedó **congelada en el build del 6/10**: la página carga (200) pero
sin ninguna de las correcciones del 7/10 en adelante. La causa es un `buildCommand`
incompleto en `render.yaml`; quedó corregido y commiteado en `abaef87`.

## 2. Diagnóstico (reproducido, no supuesto)

Reproducción: clone limpio del commit en cuestión (`83059a0`), Node v24.13.0, y el
`buildCommand` exacto de `render.yaml`:

```
npm install && npm install --prefix frontend && npm run build   → exit 0 (build OK)
npm start                                                        → crash inmediato
```

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'dotenv'
imported from .../backend/src/index.js
```

**Causa raíz:** `backend/package.json` tiene sus propias dependencias
(`express`, `cors`, `dotenv`, `nodemailer`), y el `buildCommand` sólo instalaba la raíz
(sólo `concurrently`) y `frontend/`. El build pasaba igual —por eso no se veía un error
de compilación— pero el proceso de arranque moría apenas arrancaba, y Render marca eso
como *Deploy failed*.

**Por qué empezó a fallar el 7/10:** con el re-monorepo (`fe2c038`, `83059a0`) las
dependencias del backend pasaron a vivir en `backend/package.json` y el `buildCommand`
no se actualizó. Antes de ese cambio las deps estaban en la raíz y todo instalaba junto.
En el equipo de desarrollo local no se notaba porque `backend/node_modules` ya existía.

## 3. Reparación

`render.yaml`:

```yaml
buildCommand: npm install && npm install --prefix backend && npm install --prefix frontend && npm run build
```

(con comentario explicando por qué hace falta). `README.md`: paso 1 del "deploy a mano"
actualizado con el mismo comando. Commit: `abaef87`.

## 4. Verificación

Ambas corridas en entorno limpio (sin `node_modules`), sin `.env`, con `DB_PATH` apuntando
a un directorio existente:

| Check | Resultado |
|---|---|
| buildCommand nuevo (3 installs + `npm run build`) | ✅ exit 0 |
| `npm start` | ✅ arranca, `[DB] ... disco persistente` |
| `GET /` · `GET /admin` · `GET /api/servicios` | ✅ 200 / 200 / 200 |
| `npm test` (Vitest UI) | ✅ 34/34 |
| `npm run smoke` (51 chequeos API) | ✅ 51/51 (sin `.env`; ver nota) |

**Nota sobre el smoke local:** en este workspace el smoke da 9 FAIL porque `.env` tiene
credenciales de Gmail reales: `/api/auth/recuperar` manda el mail de verdad y ya no
devuelve el `token` "demo" que el smoke usa, y de ahí se caen 8 chequeos más en cadena.
No es bug de código: en un entorno sin `.env` (como Render) pasa 51/51.

## 5. Estado del deploy al momento de este informe

- `git push origin master` → `83059a0..abaef87` ✅ (incluye los 2 commits que estaban sin subir).
- La app de GitHub **Render** sigue instalada con acceso a **todos** los repositorios ✅.
- **Render todavía no creó ningún deployment para `abaef87`** (~25 min después del push);
  Vercel sí reaccionó al mismo push. El sitio sigue sirviendo el build viejo
  (`assets/index-ConuQDpZ.js`, `last-modified: 6 de octubre`).
- Mientras tanto los deploys de Render que sí existen siguen siendo los fallidos de
  `83059a0` (9/10 y 14/10).

Falta confirmar en el dashboard de Render (requiere iniciar sesión con email/contraseña o
Google; la cuenta GitHub está habilitada para deploy pero **no** como método de login):

1. Si "Deploy on push" sigue activo para el servicio `lubricentro-san-jose`.
2. El log real del último deploy fallido (debe coincidir con el `ERR_MODULE_NOT_FOUND` de la sección 2, ya corregido).
3. Disparar un deploy y confirmar que pasa *Live*.
4. Que el plan soporte `plan: starter` con disco (el Blueprint usa un disco de 1 GB, que
   sólo existe en planes de pago).

## 6. Pendientes fuera de este alcance

- **Vercel**: `Production` viene fallando desde el 7/10 (también en `abaef87`). El "About"
  del repo apunta a `lubricentro-san-jose-black.vercel.app`; hay que revisar su build
  (mismo problema de dependencias y/o directorio de salida).
- **TP-Grupal (`UTN-DS25-Grupo-4-`)**: sin tocar, tal como se pidió.
