# Gestión San José — Lubricentro

App de gestión de turnos para lubricentro: portal cliente + panel administrador.

## Desarrollo

```bash
npm install
npm run dev:all   # API (:3001) + frontend Vite (:5173)
```

## Producción (un solo proceso, un solo puerto)

```bash
npm run build   # genera dist/
npm start       # Express sirve la API y el build en el puerto 3001 (o $PORT)
```

## Deploy (Render / Railway / Fly.io)

El repo incluye un [`render.yaml`](render.yaml) (Blueprint), así que alcanza con
**New → Blueprint** y apuntar al repo: Render crea el servicio con el build, el
disco y las variables ya configurados.

Si lo creás a mano:

1. **Build command:** `npm install && npm install --prefix backend && npm run build`
2. **Start command:** `npm start`
3. **Environment:** `PORT` (Render lo define solo), `NODE_VERSION=24`
4. Listo: la URL pública sirve frontend y API juntos (`/`, `/admin`, `/api/*`).

### Persistencia de la base

La DB SQLite se guarda en la ruta que indique `DB_PATH` (por defecto
`server/lubricentro.db`). En un hosting con disco efímero **se pierde en cada
redeploy**, así que hay que guardarla en un disco persistente:

- **Render:** el Blueprint monta un disco de 1 GB en `/var/data` y apunta
  `DB_PATH=/var/data/lubricentro.db`. Ojo: Render **solo ofrece discos en planes
  pagos**, por eso el Blueprint usa `plan: starter`. Con `plan: free` la app
  funciona igual, pero los turnos se pierden en cada deploy.
- **Alternativa sin disco:** migrar a Postgres/Supabase.

## Admin

Crear/editar el administrador:

```bash
node frontend/scripts/crear-admin.mjs tu@email.com tuClaveSegura "Tu Nombre"
```

Seed por defecto (primera vez): `admin@sanjose.com / admin123` — cambiala en cuanto puedas.

## Scripts útiles

| Comando | Qué hace |
|---|---|
| `npm test` | Tests de UI (vitest) |
| `npm run smoke` (o `node frontend/scripts/api-smoke.mjs`) | Smoke test de la API (28 chequeos) |
| `npm run build` | Build de producción |
| `npm start` | Servidor único (API + frontend) |
