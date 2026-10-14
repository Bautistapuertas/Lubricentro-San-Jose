# Lubricentro San José

Proyecto de gestión de servicios, turnos, clientes, vehículos, lavados y usuarios.

- **Frontend:** React + Vite + React Bootstrap (`frontend/`)
- **Backend:** Node.js + Express 5 + PostgreSQL (`backend/`)
- **Base de datos:** PostgreSQL 16
- **Documentación del TP:** `docs/`
- **Deploy:** Render (`render.yaml`)

## 📁 Estructura del repositorio

```text
.
├── backend/
│   ├── src/
│   │   ├── config/         # .env, prisma.ts, env.ts
│   │   ├── controllers/    # auth, cliente, servicio, turno, usuario, lavado
│   │   ├── middleware/     # auth, authorize, asyncHandler, errorHandler, validate
│   │   ├── routes/         # /api/auth, /api/clientes, /api/servicios, /api/turnos, /api/usuarios, /api/lavados, /api
│   │   ├── services/       # lógica de negocio y consultas a Prisma
│   │   ├── utils/          # helpers y caché
│   │   ├── validations/    # esquemas Zod para body y params
│   │   └── index.ts        # punto de entrada
│   ├── prisma/
│   │   ├── schema.prisma   # modelo de datos y relaciones
│   │   ├── migrations/     # historial de migraciones
│   │   └── seed.ts         # datos de ejemplo
│   ├── .env.example
│   ├── .gitignore
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, Footer, Layout
│   │   ├── context/        # AuthContext
│   │   ├── hooks/          # useFetch, usePost
│   │   ├── pages/          # Home, Servicios, Clientes, Vehiculos, Panel, Login, PerfilCliente, AltaUsuario, AltaLavado, AltaTurno
│   │   ├── services/       # api.js, sesion.js
│   │   ├── schemas/        # Zod schemas del frontend
│   │   ├── validations/    # Zod validations del frontend
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── .env.example
│   ├── .gitignore
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   └── vitest.config.js
├── docker-compose.yml
├── render.yaml
└── README.md
```

## 🚀 Desarrollo local

### 1) Clonar y entrar en la carpeta

```bash
cd Lubricentro-San-Jose
```

### 2) Variables de entorno

Crea `backend/.env` a partir de `backend/.env.example` y completa las credenciales:

```bash
cp backend/.env.example backend/.env
```

```env
DATABASE_URL=postgresql://postgres:tu_password_segura@db:5432/hello_rubricentro_db
JWT_SECRET=super_secret_jwt_key_sanjose_2026
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### 3) Levantar con Docker Compose

```bash
docker compose up -d --build
```

Esto levanta:

- `api` → `http://localhost:3000` (Express + PostgreSQL)
- `db` → PostgreSQL en `localhost:5432`
- `frontend` → React en `localhost:5173` (si lo define tu desarrollo)

Si quieres ejecutar el build de producción:

```bash
docker compose build
```

### 4) Levantar sin Docker

```bash
npm install
npm --prefix backend install
npm --prefix backend run dev
```

y en otro terminal:

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

## 🚀 Deploy

### Render

El `render.yaml` define:

- servicio web
- `buildCommand`
- `startCommand`
- almacén de variables de entorno
- disco persistente para la base de datos

Para desplegar:

```bash
git push origin master
```

Render ejecutará el `buildCommand` y el `startCommand` definidos en el archivo.

### GitHub Actions

El `.github/workflows/ci.yml` ejecuta en cada push:

1. El `build` del frontend.
2. El `build` del backend.
3. El `test` del backend.

## 🧪 Pruebas

```bash
npm run test
```

## 📝 Documentación

- `docs/README.md`
- `docs/informe-deploy-render-2026-10-14.md`
