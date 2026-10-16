# 🎓 Guía Completa de Exposición y Defensa Oral — SGI Lubricentro San José
**Materia:** Desarrollo de Software 2026 (UTN) — **Recorrido completo: Clases 1 a 21**

Esta guía explica **todo el proyecto de punta a punta** con ejemplos reales extraídos de tu código actual, ordenada exactamente según los temas que evalúa la cátedra desde la Clase 1 hasta la Clase 21.

---

## 📌 Bloque 1: Análisis, Dominio, Backlog y Diseño de API (Clases 1 a 6)
Toda la documentación formal solicitada por la cátedra está en la carpeta `docs/`:

### 1.1. Visión y Alcance (`docs/00 Documento de Visión y Alcance`)
* **Problema que resuelve:** En un lubricentro/lavadero tradicional los turnos se anotan en papel o WhatsApp, generando superposición de horarios, pérdida del historial de mantenimiento de cada auto y desconocimiento de cuándo le toca el próximo cambio de aceite.
* **Solución (SGI San José):** Plataforma web con dos portales:
  1. **Portal Cliente:** Registro/Login, reserva de turnos verificando disponibilidad horaria en tiempo real, consulta de sus vehículos (con alerta automática de próximo service a los **10.000 km o 12 meses**) y descarga de comprobantes en su historial (`#GSJ-xxxxx`).
  2. **Portal Administración / Taller:** Dashboard con métricas e ingresos, gestión de agenda de turnos (cambio de estados), ABM (CRUD) de Servicios, Clientes, Vehículos, Lavados y centro de notificaciones/correos.

### 1.2. Modelo de Dominio y Máquina de Estados (`docs/02 - Modelado de Dominio`)
* **Entidades principales:** `Usuario`, `Cliente`, `Vehiculo`, `Turno`, `Servicio`, `Historial`, `Lavado`, `Notificacion`, `Mail`.
* **Ciclo de vida (Máquina de Estados) de un `Turno`:**
  ```text
  [Pendiente] ──► [Confirmado] ──► [En taller] ──► [Completado] (Genera Historial #GSJ y actualiza KM del Vehículo)
       │               │
       └──► [Cancelado]◄┘ (Libera el horario en la agenda para que otro cliente pueda reservarlo)
  ```

---

## 📌 Bloque 2: Arquitectura del Backend en Capas y Express (Clases 7 a 10)

El backend (`backend/src/`) está construido con **Node.js + Express + TypeScript** siguiendo una **arquitectura en capas** para separar responsabilidades:

```text
Petición HTTP (Cliente / React)
   │
   ▼
1. Punto de Entrada (src/index.ts) ──► Configura CORS, express.json() y monta los routers en /api/*
   │
   ▼
2. Rutas (src/routes/*.routes.ts) ──► Define el verbo HTTP (GET, POST, PUT, PATCH, DELETE) y la cadena de middlewares
   │
   ▼
3. Middlewares (src/middleware/*)
   ├── auth.ts          ──► Verifica el token JWT (¿Quién sos? -> Si falla: 401 Unauthorized)
   ├── authorize.ts     ──► Verifica el Rol (¿Tenés permiso? -> Si falla: 403 Forbidden)
   └── validate.ts      ──► Valida req.body y req.params con Zod (Si falla: 400 Bad Request)
   │
   ▼
4. Controladores / Servicios (src/controllers/* y src/services/*)
   └── Contiene las reglas de negocio (ej: verificar horario libre, calcular próximo service, hashear clave)
   │
   ▼
5. Acceso a Datos con Prisma ORM (src/config/prisma.ts + prisma/schema.prisma)
   └── Ejecuta las consultas tipadas contra PostgreSQL 16
   │
   ▼
6. Middleware Global de Errores (src/middleware/errorHandler.ts)
   └── Atrapa cualquier excepción no controlada y responde con un JSON estandarizado
```

---

## 📌 Bloque 3: Verbos HTTP, Endpoints REST y Códigos de Estado (Clases 8 a 10)

### 3.1. ¿Para qué se usa cada verbo HTTP en nuestro proyecto?

| Verbo HTTP | Propósito en REST | Ejemplo real en Lubricentro | ¿Qué devuelve? |
| :--- | :--- | :--- | :--- |
| **`GET`** | **Consultar / Leer** recursos (no modifica datos, es idempotente). | `GET /api/servicios`<br>`GET /api/turnos/disponibles?fecha=2026-10-20`<br>`GET /api/clientes/3` | `200 OK` con el JSON del recurso o lista, o `404 Not Found` si el ID no existe. |
| **`POST`** | **Crear** un recurso nuevo o disparar una acción de negocio. | `POST /api/turnos` (crea reserva)<br>`POST /api/clientes` (da de alta cliente)<br>`POST /api/auth/login` (inicia sesión) | `201 Created` al crear una entidad nueva, `409 Conflict` si el horario o email ya está ocupado. |
| **`PUT`** | **Actualizar / Reemplazar** un recurso existente por ID. | `PUT /api/servicios/1`<br>`PUT /api/clientes/3`<br>`PUT /api/vehiculos/2` | `200 OK` con el recurso actualizado, o `404 Not Found` si no existe. |
| **`PATCH`** | **Actualización parcial** (modificar solo uno o pocos campos específicos de un recurso, como su estado). | `PATCH /api/turnos/3/estado` (envía solo `{ "estado": "Completado", "km": 62000 }`) | `200 OK` tras aplicar el cambio parcial. |
| **`DELETE`** | **Eliminar** un recurso por ID. | `DELETE /api/turnos/5`<br>`DELETE /api/servicios/6`<br>`DELETE /api/clientes/4` | `204 No Content` (éxito sin cuerpo de respuesta) o `404 Not Found`. |

### 3.2. Ejemplo de código real de una ruta con todos los verbos (`backend/src/routes/servicio.routes.ts`)

```typescript
// GET público: cualquiera puede ver el catálogo activo
router.get("/", async (_req, res, next) => {
  try {
    const servicios = await servicioService.listarPublicos();
    res.json(servicios); // 200 OK
  } catch (error) {
    next(error); // Pasa el error al errorHandler
  }
});

// GET por ID: valida primero que :id sea un número entero positivo con Zod
router.get("/:id", validateParams(idParamSchema), async (req, res, next) => {
  try {
    const servicio = await servicioService.getById(req.params.id);
    if (!servicio) {
      res.status(404).json({ error: "Servicio no encontrado" });
      return;
    }
    res.json(servicio);
  } catch (error) {
    next(error);
  }
});

// POST: requiere estar logueado (auth), ser ADMIN o EMPLEADO (authorize) y pasar validación Zod (validateBody)
router.post(
  "/",
  auth,
  authorize("ADMIN", "EMPLEADO"),
  validateBody(servicioCreateSchema),
  async (req, res, next) => {
    try {
      const nuevo = await servicioService.crear(req.body);
      res.status(201).json({ ok: true, id: nuevo.id, servicio: nuevo });
    } catch (error) {
      next(error);
    }
  }
);

// PUT y PATCH: validan tanto el :id de la URL como el body parcial
router.put("/:id", auth, authorize("ADMIN", "EMPLEADO"), validateParams(idParamSchema), validateBody(servicioUpdateSchema), updateHandler);
router.patch("/:id", auth, authorize("ADMIN", "EMPLEADO"), validateParams(idParamSchema), validateBody(servicioUpdateSchema), updateHandler);

// DELETE: solo el ADMIN puede borrar un servicio del catálogo; devuelve 204 No Content
router.delete("/:id", auth, authorize("ADMIN"), validateParams(idParamSchema), async (req, res, next) => {
  try {
    await servicioService.eliminar(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
```

---

## 📌 Bloque 4: Validaciones con Zod y Middlewares (Clases 11 y 12)

### 4.1. ¿Por qué validamos con Zod en el Backend si el Frontend ya tiene formularios?
Porque un usuario malintencionado puede saltearse el navegador y enviar peticiones directas a la API usando **Postman, Insomnia o cURL** con precios negativos, textos vacíos o tipos de datos erróneos. **Zod** garantiza que ningún dato inválido llegue a la capa de servicios ni a la base de datos.

### 4.2. Esquemas de Zod (`backend/src/validations/servicio.validation.ts`)

```typescript
import { z } from "zod";

// 1. Esquema para CREACIÓN (POST): campos obligatorios con reglas estrictas
export const servicioCreateSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(120),
  categoria: z.string().min(1, "La categoría es obligatoria").max(80),
  precio: z.coerce.number().positive("El precio debe ser un número positivo"),
  duracion: z.coerce.number().positive("La duración debe ser un número positivo").optional().default(60),
  publico: z.coerce.number().or(z.boolean()).optional().default(1),
}).passthrough();

// 2. Esquema para ACTUALIZACIÓN (PUT / PATCH): .partial() vuelve opcionales todos los campos
export const servicioUpdateSchema = servicioCreateSchema.partial();

// 3. Esquema para PARÁMETROS DE RUTA (/:id)
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive("El ID debe ser un número entero positivo"),
});
```

> **💡 Detalle clave para decir en la exposición sobre `z.coerce.number()`:**
> En Express, todos los parámetros de la URL (`req.params.id`, por ejemplo en `/api/servicios/5`) llegan siempre como **`string` (`"5"`)**. Si usáramos `z.number()`, Zod rechazaría `"5"` por ser texto. Al usar **`z.coerce.number().int().positive()`**, Zod convierte automáticamente `"5"` al número `5` y verifica que sea entero y mayor a cero; pero si alguien manda `/api/servicios/abc`, falla limpiamente con `400 Parámetro inválido`.

### 4.3. Middleware de Validación (`backend/src/middleware/validate.ts`)

```typescript
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed; // Reemplaza req.body con los datos ya limpios y tipados por Zod
      next();            // Todo OK: pasa al siguiente middleware o controlador
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: "Validación inválida",
          details: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}
```

### 4.4. Middleware Global de Manejo de Errores (`backend/src/middleware/errorHandler.ts`)
En Express, un middleware de error se distingue porque recibe **4 parámetros: `(err, req, res, next)`** y se coloca al final de `src/index.ts` (`app.use(errorHandler)`):

```typescript
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Error de validación",
      details: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  const status = (err as any)?.status || (err as any)?.statusCode || 500;
  const message = err instanceof Error ? err.message : "Error interno del servidor";

  res.status(status).json({ error: message });
}
```

---

## 📌 Bloque 5: PostgreSQL 16 + Prisma ORM + Reglas de Negocio (Clases 13 a 16)

### 5.1. Esquema de Prisma (`backend/prisma/schema.prisma`)
Prisma define el modelo de datos declarativo y genera el cliente TypeScript tipado:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Rol {
  ADMIN
  EMPLEADO
  CLIENTE
}

model Cliente {
  id        Int        @id @default(autoincrement())
  nombre    String
  email     String     @unique
  telefono  String?
  dni       String?
  vehiculos Vehiculo[] // Relación 1 a N: un cliente puede tener varios vehículos
  turnos    Turno[]    // Relación 1 a N: un cliente puede reservar varios turnos
  createdAt DateTime   @default(now())
}

model Vehiculo {
  id            Int      @id @default(autoincrement())
  cliente       Cliente? @relation(fields: [clienteId], references: [id], onDelete: Cascade)
  clienteId     Int?
  patente       String
  patenteNorm   String   @unique // Normalizada sin espacios ni guiones (ej: "AB123CD") para evitar duplicados
  marca         String?
  modelo        String?
  km            Int      @default(0)
  ultimoKm      Int?
  ultimoService String?
  turnos        Turno[]
}
```

### 5.2. Reglas de Negocio Destacadas en los Servicios
1. **Normalización de Patentes (`clientes.service.ts`):**
   * `"ab 123 cd"`, `"AB-123-CD"` y `"AB123CD"` se transforman con `.toUpperCase().replace(/[^A-Z0-9]/g, "")` en `"AB123CD"` (`patenteNorm @unique`). Así nunca se duplica el mismo auto en la base.
2. **Cálculo de Próximo Service (`vehiculos.service.ts`):**
   * Regla del taller: **cada 10.000 km o 12 meses** desde el último service (`ultimoKm` y `ultimoService`).
   * Devuelve el estado `"ok"`, `"proximo"` (cuando faltan $\le 1.500\text{ km}$ o $\le 30\text{ días}$) o `"vencido"`.
3. **Control de Disponibilidad Horaria y Facturación (`turnos.service.ts`):**
   * Antes de crear o reprogramar un turno, `horarioLibre(fecha, hora)` verifica con `prisma.turno.count()` que no exista otro turno activo (`Pendiente`, `Confirmado` o `En taller`) en esa misma fecha y hora. Si está ocupado, devuelve **`409 Conflict`**.
   * Cuando un turno pasa al estado **`Completado`**, automáticamente actualiza el kilometraje del vehículo (`registrarService`) y genera el comprobante único **`#GSJ-xxxxx`** en la tabla `Historial`.

---

## 📌 Bloque 6: Seguridad, Autenticación JWT y Autorización RBAC (Clases 17 y 18)

### 6.1. Hashing de Contraseñas con `bcryptjs` (`usuario.service.ts`)
Nunca guardamos contraseñas en texto plano en la base de datos:
* **En el Registro (`POST /api/auth/registro`):**
  ```typescript
  const passwordHash = bcrypt.hashSync(data.password, 10); // 10 salt rounds
  ```
* **En el Login (`POST /api/auth/login`):**
  ```typescript
  if (!usuario || !bcrypt.compareSync(data.password, usuario.passwordHash)) {
    throw { status: 401, message: "Credenciales incorrectas" };
  }
  ```

### 6.2. Diferencia entre `auth.ts` (Autenticación) y `authorize.ts` (Autorización)

1. **`auth.ts` (Autenticación — "¿Quién sos?"):**
   Lee el header `Authorization: Bearer <token>`, verifica la firma criptográfica con `jwt.verify(token, JWT_SECRET)` y guarda los datos del usuario en `req.user`. Si no hay token o expiró, corta la petición con **`401 Unauthorized`**.
2. **`authorize.ts` (Autorización RBAC — "¿Qué permisos tenés?"):**
   Recibe los roles permitidos (por ejemplo `authorize("ADMIN", "EMPLEADO")`) y los compara con `req.user.rol`. Si un usuario con rol `CLIENTE` intenta borrar un servicio o ver la agenda general del taller, devuelve **`403 Forbidden` ("No tenés permiso para esta operación")**.

---

## 📌 Bloque 7: Frontend React + Vite y Tests con Vitest (Clases 19 y 20)

* **Cliente HTTP centralizado (`frontend/src/api.js`):**
  Todas las pantallas usan la función `api(path, { method, body })` que adjunta automáticamente el header `Authorization: Bearer <token>` guardado en `localStorage`.
* **Rutas Protegidas (`frontend/src/components/ProtectedRoute.jsx`):**
  Impide que un usuario no autenticado entre a `/reservar-turno` o `/historial`, y verifica que solo cuentas con rol `admin` puedan acceder a `/admin/*`.
* **Tests Automatizados (`frontend/src/__tests__/app.test.jsx`):**
  34 tests con **Vitest + React Testing Library** que prueban renderizado, login, validaciones de formularios, reserva de turnos, panel de administración y filtros. Se ejecutan con:
  ```bash
  npm test --prefix frontend
  ```

---

## 📌 Bloque 8: Docker, Multi-Stage Builds, Docker Compose y Deploy (Clase 21)

### 8.1. `backend/Dockerfile` (Multi-Stage Build)
Usamos una construcción en **2 etapas (Multi-Stage)** sobre `node:22-alpine` para que la imagen final sea liviana y segura:
1. **Etapa 1 (`AS build`):** Instala dependencias (`npm install`), genera el cliente de Prisma (`npx prisma generate`) y compila el código TypeScript a JavaScript en la carpeta `dist/` (`npm run build`).
2. **Etapa 2 (Imagen final de producción):** Instala `openssl` (requerido por el motor de Prisma en Alpine), copia los artefactos compilados (`dist/`, `node_modules/`, `prisma/`), expone el puerto `3000` y al arrancar sincroniza el esquema con `npx prisma db push` antes de ejecutar `node dist/index.js`.

### 8.2. `frontend/Dockerfile` (Build con Vite + Servidor Nginx)
1. **Etapa 1 (`AS build`):** Con `node:22-alpine` ejecuta `npm ci` y `npm run build` para empaquetar la aplicación React en archivos estáticos optimizados (`dist/`).
2. **Etapa 2 (`nginx:stable-alpine`):** Copia la carpeta `dist/` dentro de Nginx y aplica `nginx.conf` (que sirve la SPA con `try_files $uri /index.html` y redirige `/api/` al contenedor del backend).

### 8.3. `docker-compose.yml` (Orquestación de los 3 contenedores)
Con un solo comando (`docker compose up --build`), Docker levanta toda la arquitectura:
1. **`db` (`postgres:16-alpine`):**
   * Corre el motor PostgreSQL 16 en el puerto `5432`.
   * Define un **volumen persistente (`pgdata:/var/lib/postgresql/data`)**: esto garantiza que aunque apagues o reinicies los contenedores, los usuarios registrados, turnos y clientes quedan guardados en el disco.
   * Define un **`healthcheck` (`pg_isready -U postgres -d lubricentro_db`)**: comprueba cada 5 segundos si PostgreSQL ya está listo para recibir conexiones.
2. **`api` (Backend Express + Prisma):**
   * Usa `depends_on: db: condition: service_healthy`: espera a que PostgreSQL esté saludable antes de iniciar el backend.
   * Recibe `DATABASE_URL=postgresql://postgres:postgres@db:5432/lubricentro_db` (en la red interna de Docker, el host de la base de datos se llama `db`).
3. **`frontend` (React + Nginx):**
   * Expone el puerto `80` (`http://localhost`) y depende del servicio `api`.

---

## 🎯 Bloque 9: Preguntas Clásicas de los Profesores en la Exposición (y cómo responderlas)

1. **¿Qué diferencia hay entre `PUT` y `PATCH` y dónde lo usaron?**
   * *Respuesta:* `PUT` se usa para actualizar una entidad completa (por ejemplo `PUT /api/servicios/:id` cuando editamos un servicio desde el modal de administración), mientras que `PATCH` se usa para modificaciones parciales específicas, como en `PATCH /api/turnos/:id/estado`, donde solo enviamos el nuevo estado (`Confirmado`, `En taller`, `Completado` o `Cancelado`) sin tocar el resto de los datos del turno.

2. **¿Qué diferencia hay entre los errores HTTP `400`, `401`, `403`, `404` y `409`?**
   * *Respuesta:*
     * `400 Bad Request`: Los datos enviados no cumplen el esquema de validación de **Zod** (ej. precio negativo o email inválido).
     * `401 Unauthorized`: No enviaste un token JWT válido en el header `Authorization` (no estás autenticado, middleware `auth.ts`).
     * `403 Forbidden`: Estás autenticado, pero tu rol (`CLIENTE`) no tiene permisos para esa ruta (middleware `authorize.ts`, ej. intentar borrar un servicio).
     * `404 Not Found`: El ID buscado no existe en la base de datos.
     * `409 Conflict`: Conflicto con el estado actual del negocio (ej. intentar reservar un turno en una fecha y hora que ya está ocupada, o registrarse con un email que ya existe).

3. **¿Cómo evitan que dos clientes reserven el mismo turno a la misma hora?**
   * *Respuesta:* En `turnos.service.ts`, antes de insertar el turno con Prisma, la función `horarioLibre(fecha, hora)` consulta en la base si existe algún turno para esa fecha y hora cuyo estado esté en `["Pendiente", "Confirmado", "En taller"]`. Si existe, el endpoint `POST /api/turnos` devuelve HTTP `409 Conflict` indicando que ese horario ya está reservado; si ese turno anterior se cancela (`Cancelado`), el horario vuelve a quedar libre automáticamente.

4. **¿Cómo sabe el backend en Docker cómo conectarse a la base de datos si no están en `localhost`?**
   * *Respuesta:* Docker Compose crea una red interna virtual donde cada servicio se resuelve por su nombre en `docker-compose.yml`. Como el servicio de Postgres se llama `db`, en la variable `DATABASE_URL` del contenedor `api` usamos `postgresql://postgres:postgres@db:5432/lubricentro_db`. Además usamos `healthcheck` con `pg_isready` para que la API recién arranque cuando Postgres esté aceptando conexiones.
