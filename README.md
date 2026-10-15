# SGI San José — Sistema de Gestión Integral (Lavadero y Lubricentro)

Proyecto desarrollado para la cátedra **Desarrollo de Software 2026** (UTN - FRD).
Gestión operativa y comercial de servicios, turnos, clientes, vehículos, lavados y usuarios.

- **Frontend:** React + Vite + React Router (`frontend/`)
- **Backend:** Node.js + Express + TypeScript + Prisma ORM (`backend/`)
- **Base de Datos:** PostgreSQL 16
- **Contenedores:** Docker & Docker Compose (`docker-compose.yml`)
- **Documentación:** Carpeta `docs/` (Visión, Requerimientos, Backlog, UX/UI, Contrato de API, Matriz RBAC e Informes)
- **Deploy:** Vercel (Frontend) & Render (Backend)

---

## 📁 Estructura del repositorio

```text
.
├── backend/
│   ├── src/
│   │   ├── config/         # env.ts, prisma.ts
│   │   ├── controllers/    # auth, cliente, servicio, turno, usuario, lavado
│   │   ├── middleware/     # auth (JWT stateless), authorize (RBAC), errorHandler, validate
│   │   ├── routes/         # auth, cliente, vehiculo, servicio, turno, usuario, lavado, panel
│   │   ├── services/       # lógica de negocio sobre Prisma Client
│   │   └── index.ts        # servidor Express, CORS y montaje de rutas
│   ├── prisma/
│   │   ├── schema.prisma   # modelos de datos PostgreSQL (Usuario, Cliente, Vehiculo, Turno, etc.)
│   │   └── seed.ts         # datos iniciales de prueba (usuarios, servicios, turnos)
│   ├── Dockerfile          # imagen optimizada multi-stage con Node 22 Alpine
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── assets/         # iconos SVG y recursos visuales
│   │   ├── components/     # Layout, AdminLayout, Header, ProtectedRoute
│   │   ├── pages/          # Login, Registro, ReservarTurno, Historial
│   │   │   └── admin/      # Dashboard, Turnos, Servicios, Clientes, Vehiculos, Correos, Reportes
│   │   ├── api.js          # cliente API centralizado con soporte VITE_API_URL
│   │   └── __tests__/      # suite de pruebas Vitest (34 tests unitarios y de integración)
│   ├── Dockerfile          # build estático servido con Nginx
│   ├── nginx.conf          # proxy reverso /api -> backend:3000 y fallback SPA
│   ├── vercel.json         # rewrites para SPA en Vercel
│   └── package.json
├── docs/                   # Documentación oficial de la materia
│   ├── 00 Documento de Visión y Alcance/
│   ├── 01 - Análisis Inicial/
│   ├── 02 - Modelado de Dominio/
│   ├── 03-Backlog/
│   ├── 04 UX-UI/
│   ├── 05 - Diseño de API/
│   ├── Informes/
│   └── README.md
├── docker-compose.yml      # orquestación local: api + db (Postgres 16) + frontend
├── render.yaml             # infraestructura como código para Render (Free Tier)
└── package.json            # scripts raíz para build unificado
```

---

## 🚀 Puesta en marcha local

### Opción A: Con Docker Compose (Recomendado para entrega y evaluación)

Requiere tener **Docker Desktop** iniciado:

```bash
docker compose up --build
```

Esto levanta automáticamente:
1. **`db`** → PostgreSQL 16 en el puerto `5432` con volumen persistente `pgdata`.
2. **`api`** → Backend Node.js en el puerto `3000` (`http://localhost:3000`), sincronizando el schema con `prisma db push`.
3. **`frontend`** → Frontend React servido por Nginx en el puerto `80` (`http://localhost`).

### Opción B: Sin Docker (Desarrollo local con Node)

1. **Instalar dependencias:**
   ```bash
   npm run install:all
   ```

2. **Configurar variables de entorno:**
   Crear `backend/.env` copiando `backend/.env.example`. Si usas una base de datos local o en Neon, completa la variable:
   ```env
   DATABASE_URL="postgresql://usuario:password@host:5432/nombre_db"
   JWT_SECRET="clave_secreta_jwt"
   ```

3. **Sincronizar base de datos y poblar datos semilla:**
   ```bash
   npm run prisma:generate --prefix backend
   npx prisma db push --schema backend/prisma/schema.prisma
   npm run prisma:seed --prefix backend
   ```

4. **Iniciar en modo desarrollo:**
   - En una terminal: `npm run dev:backend` (puerto 3000)
   - En otra terminal: `npm run dev:frontend` (puerto 5173 en `http://localhost:5173`)

---

## 🧪 Pruebas automatizadas

El proyecto cuenta con una suite completa de pruebas unitarias y de integración de componentes:

```bash
npm test --prefix frontend
```

---

## 🌐 Despliegue en la Nube (Producción Gratuita)

### 1. Base de datos: Neon PostgreSQL (Recomendado)
- Crear una base de datos PostgreSQL gratuita en [Neon.tech](https://neon.tech).
- Copiar la cadena de conexión `DATABASE_URL` (incluye `?sslmode=require`).

### 2. Backend: Render
- Crear un nuevo **Web Service** en [Render](https://dashboard.render.com) apuntando a este repositorio.
- Seleccionar **Docker** (o usar `render.yaml`).
- Configurar las Variables de Entorno:
  - `DATABASE_URL`: tu cadena de conexión a Postgres (de Neon o Render Postgres).
  - `JWT_SECRET`: una clave secreta segura.
  - `FRONTEND_URL`: la URL que te asigna Vercel (ej. `https://lubricentro.vercel.app`).
  - `PORT`: `3000`

### 3. Frontend: Vercel
- Conectar el repositorio en [Vercel](https://vercel.com).
- Establecer **Root Directory** en `frontend`.
- En **Environment Variables**, agregar:
  - `VITE_API_URL`: la URL pública de tu backend en Render (ej. `https://lubricentro-backend.onrender.com`).
- Desplegar. Vercel compila con `npm run build` y sirve la SPA usando `vercel.json`.

---

## 👥 Credenciales de prueba (Seed)

- **Administrador:** `admin@sanjose.com` / `admin123`
- **Cliente:** `juan@test.com` / `cliente123`
