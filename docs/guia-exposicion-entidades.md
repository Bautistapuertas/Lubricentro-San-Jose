# Guía de exposición — Clientes y Vehículos como entidades reales

> Qué hicimos, por qué lo hicimos, y cómo responder las preguntas del corrector.
> Commit: `c8b3f69` · Smoke de API: **51/51** · Tests de UI: **34/34** · Build: OK

---

## 1. El problema (por qué lo cambiamos)

Antes de este cambio, un turno guardaba el cliente y el vehículo como **texto libre**:
`"Juan Pérez"` y `"VW Gol Trend · AB 123 CD"` eran dos strings sueltos dentro de la fila `turnos`.

Tres consecuencias (esta es la justificación de todo el trabajo):

1. **No se podía buscar por DNI** — el DNI no existía en ningún lado del sistema.
2. **El mismo auto entraba N veces** — `AB 123 CD`, `ab123cd` y `ab-123-cd` eran "tres autos distintos".
3. **Cero integridad referencial** — un error de tipeo partía la trazabilidad: imposible saber qué services llevó un vehículo ni calcular su próximo mantenimiento.

La solución estándar en bases de datos se llama **normalización**: crear entidades con clave primaria propia (`id`) y que el turno las referencie por clave foránea (`cliente_id`, `vehiculo_id`), en vez de repetir texto.

---

## 2. El modelo de datos (lo que van a preguntar seguro)

```sql
CREATE TABLE clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,   -- clave de unicidad lógica
  telefono TEXT,
  dni TEXT
);

CREATE TABLE vehiculos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER REFERENCES clientes(id),  -- FK real
  patente TEXT NOT NULL,
  patente_norm TEXT NOT NULL UNIQUE,           -- 'AB123CD'
  marca TEXT, modelo TEXT,
  km INTEGER,           -- kilometraje actual informado
  ultimo_km INTEGER,    -- km congelados al momento del último service
  ultimo_service TEXT   -- fecha del último service
);
```

### Preguntas típicas y respuestas

**¿Por qué dos columnas de patente?**
`patente` guarda lo que escribió el usuario; `patente_norm` es una **clave derivada**: mayúsculas, sin espacios ni guiones (`'AB123CD'`), con restricción `UNIQUE`. La función de normalización es una sola: `toUpperCase() + replace(/[^A-Z0-9]/g, '')`. Resultado: cargar el mismo auto con distinto formato **lo actualiza en vez de duplicarlo** (esto es un *upsert*, ver §4).

**¿Por qué `km` y `ultimo_km` son distintos?**
`km` es el dato vivo que el cliente informa en cada reserva. `ultimo_km` queda congelado al marcar el turno Completado y es la **base de cálculo** del próximo service. Son conceptos distintos y por eso viven en columnas distintas.

**¿Qué pasó con los datos viejos?**
**Migración automática e idempotente** (`migrarTurnosLegados()` en `db.js`): al arrancar, cada turno sin `vehiculo_id` se vincula parseando su texto, creando cliente (por email) y vehículo si no existen. `ON CONFLICT DO NOTHING` garantiza que correrla dos veces no duplique nada. Se corre **después** del `seed()`, así una base nueva también queda migrada. Verificado: los 6 turnos semilla quedaron vinculados a 6 vehículos reales.

**Limitación declarada (mencionarla ustedes mismos suma puntos):**
SQLite no permite declarar una foreign key sobre una columna agregada con `ALTER TABLE`, así que las filas migradas tienen la FK "lógica" (por valor), no "física" (por constraint). Para los turnos nuevos la integridad la garantiza la capa de servicios. Es un trade-off consciente y está documentado en un comentario del código.

---

## 3. Arquitectura: routes → controller → service → db

Se respetó la arquitectura en capas que ya tenía el backend:

| Capa | Archivo | Responsabilidad |
|---|---|---|
| Rutas | `entidades.routes.js` | mapear HTTP → controller, aplicar `authMiddleware('admin')` |
| Controller | (inline en rutas, simple) | validar request, responder |
| Service | `clientes.service.js` / `vehiculos.service.js` | lógica de negocio (upsert, búsqueda, cálculo) |
| DB | `config/db.js` | esquema y migración |

**¿Por qué la lógica en el service y no en la ruta?** Separación de responsabilidades: la ruta solo traduce HTTP; la lógica reusable vive en el service y puede testearse sin servidor.

### Endpoints nuevos

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/clientes?q=` | búsqueda por nombre, email, **DNI** o **patente** |
| GET | `/api/clientes/:id` | detalle con vehículos vinculados |
| POST | `/api/clientes` | alta manual (admin), 409 si email duplicado |
| PATCH | `/api/clientes/:id` | editar contacto |
| GET | `/api/vehiculos?q=` | búsqueda por patente/marca/modelo |
| POST | `/api/vehiculos` | alta manual, valida cliente existente |
| PATCH | `/api/vehiculos/:id` | editar marca/modelo/km |
| POST | `/api/vehiculos/:id/service` | registrar service (km + fecha) |
| GET | `/api/mis-vehiculos` | vehículos del **cliente autenticado** (rol cliente) |

---

## 4. Seguridad (pregunta casi segura)

- **¿Por qué el cliente no puede ver `/clientes` ni `/vehiculos`?** Porque son **PII** (datos personales de terceros). `authMiddleware('admin')` valida el token, resuelve la sesión contra la tabla `sesiones` y compara el rol. Sin permiso → **403**. Hay un check de smoke explícito para esto.
- **¿Por qué `/mis-vehiculos` es seguro si cualquier cliente lo llama?** Porque el `cliente_id` **no viene del request**: se resuelve desde el email del usuario autenticado. El cliente nunca manda un id — no hay forma de pedir los vehículos de otro. (Principio: *nunca confíes en ids que manda el cliente*.)
- **¿Por qué alta manual con 409?** El email es UNIQUE: crear dos veces el mismo cliente devuelve 409 en vez de fallar feo.

---

## 5. Cálculo de próximo service (el algoritmo)

Regla de negocio: **10.000 km o 12 meses, lo que ocurra primero.**
Constantes nombradas al inicio del service: `KM_POR_SERVICE`, `MESES_POR_SERVICE` — cambiar la política es tocar un solo lugar.

```
km del próximo service = ultimo_km + 10.000
fecha de vencimiento   = ultimo_service + 12 meses
```

`estadoService()` clasifica en tres estados:

| Estado | Condición | Color en UI |
|---|---|---|
| `vencido` | se pasó de km O la fecha ya venció | rojo |
| `proximo` | faltan ≤ 1.500 km o ≤ 30 días | ámbar |
| `ok` | el resto | verde |

**Detalle clave:** el cálculo vive en el **backend** y `listar()` decora cada fila con `estado_service`, `proximo_km_en` y `vencimiento_fecha`. La UI solo elige colores. **Fundamento:** la regla de negocio tiene una única fuente de verdad; si la UI la reimplementara, un cambio de política requeriría tocar dos lugares.

---

## 6. El circuito completo (lo mejor para contar en la expo)

1. **Reserva** — el cliente elige un vehículo guardado (dropdown de `/mis-vehiculos`) o carga uno nuevo, e informa el km actual.
2. **Al crear el turno** — upsert del cliente (por email de la cuenta) y del vehículo (por patente normalizada); el turno queda vinculado por `cliente_id`/`vehiculo_id`. El panel de Clientes/Vehículos **se puebla solo**, sin carga manual.
3. **Se completa el trabajo** — el admin marca `Completado` (opcionalmente con km final) → `registrarService()` guarda `ultimo_km` y `ultimo_service`.
4. **Se recalcula el próximo service** — el panel de Vehículos muestra la alerta: Al día / Service próximo / Service vencido.

Este circuito tiene un test de extremo a extremo en el smoke: *"Circuito: Completar turno actualiza km del vehículo"*.

---

## 7. Frontend (dos decisiones defendibles)

**Búsqueda server-side con debounce de 300 ms** (en Clientes y Vehículos):
- *¿Por qué no `filter()` en el navegador?* Porque el DNI y la patente no están en la lista ya descargada — hay que preguntarle al servidor. Además escala: con 10.000 clientes, filtrar en memoria es inviable.
- *¿Por qué debounce?* Para no disparar un request por tecla: se espera 300 ms después de que el usuario deja de tipear.

**Selector de vehículo en ReservarTurno:** el cliente ve sus vehículos guardados y al elegirlos se autocompletan patente/marca/modelo/km. El km informado alimenta el cálculo del próximo service.

---

## 8. Verificación (números concretos)

- **Smoke de API: 51/51 PASS** (14 checks nuevos de las entidades, incluido RBAC).
- **Tests de UI (vitest): 34/34 PASS** — nada se rompió.
- **Build de producción: OK. `npm start`** (lo que corre Render): SPA 200, API 200, `/api/clientes` sin token → **401**.
- Commit `c8b3f69`.

### Respuestas rápidas para preguntas individuales

- **"¿Por qué SQLite y no MySQL?"** Motor elegido del TP: archivo único, cero configuración, `node:sqlite` nativo de Node 22+. Para la escala del taller alcanza sobrado.
- **"¿Por qué no borrar las columnas de texto viejas de turnos?"** Migración no destructiva: los textos quedan como legado/visualización, pero la fuente de verdad son los ids. Reconstruir la tabla en SQLite (requerido para borrar columnas) es riesgo sin beneficio.
- **"¿Qué es un upsert?"** Update-or-insert: buscar por clave única; si existe, actualizar; si no, crear. Es lo que impide duplicar autos/clientes.
- **"¿Qué pasa si dos reservas crean el mismo vehículo a la vez?"** `patente_norm` es `UNIQUE`: el segundo insert colisiona y el flujo lo trata como actualización. El constraint protege aunque el código falle.
- **"¿Dónde está el cálculo del próximo service?"** `backend/src/services/vehiculos.service.js` — funciones `proximoService()` y `estadoService()`.
