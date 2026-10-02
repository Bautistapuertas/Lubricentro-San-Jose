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

1. Subí este repo a GitHub.
2. Creá un nuevo **Web Service** apuntando al repo.
3. Configuración:
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`
   - **Environment:** `PORT` (Render lo define solo), Node 20+
4. Listo: la URL pública sirve frontend y API juntos (`/`, `/admin`, `/api/*`).

> La DB SQLite vive en `server/lubricentro.db`. En hosting con disco efímero se puede perder en cada redeploy — para persistencia real conviene un disco persistente (Render lo soporta) o migrar a Postgres/Supabase.

## Admin

Crear/editar el administrador:

```bash
node scripts/crear-admin.mjs tu@email.com tuClaveSegura "Tu Nombre"
```

Seed por defecto (primera vez): `admin@sanjose.com / admin123` — cambiala en cuanto puedas.

## Scripts útiles

| Comando | Qué hace |
|---|---|
| `npm test` | Tests de UI (vitest) |
| `node scripts/api-smoke.mjs` | Smoke test de la API (28 chequeos) |
| `npm run build` | Build de producción |
| `npm start` | Servidor único (API + frontend) |
