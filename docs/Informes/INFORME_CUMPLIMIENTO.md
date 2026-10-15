# Informe de cumplimiento — TP Grupal: SGI San José (Grupo 4)

Fecha de revisión: 07/10/2026. Evaluación de la carpeta de desarrollo
`UTN-DS25-Grupo-4-` contra la estructura exigida por el TP (Documentación,
Backend, Frontend, Infraestructura).

---

## 1. Documentación ✅ (completa)

| Ítem del índice | Estado | Archivo |
|---|---|---|
| 00 Visión y Alcance | ✅ | `00 Documento de Visión y Alcance/Vision_y_Alcance_SGI_SanJose.pdf` |
| 01 Análisis Inicial (Fase 1, diagrama contextual) | ✅ | `01 - Análisis Inicial/Fase 1.pdf`, `Diagrama Contextual.jpeg` |
| 02 Modelado de Dominio (entidades, RF/RN, diagrama de estado) | ✅ | `02 - Modelado de Dominio/Entidades.md`, `Fase 2.pdf`, 2 diagramas de estado + 3 capturas de gestión |
| 03 Backlog (épicas, HU, calendario) | ✅ | `03-Backlog/Epicas-y-Features.png`, `Historias_de_Usuario.pdf`, `Calendario de Planificación.pdf` |
| 04 UX/UI (3 wireframes) | ✅ | `04 UX-UI/01..03_Wireframe*.png` |
| 05 Diseño de API (operaciones + matriz RBAC) | ✅ | `05 - Diseño de API/Operaciones.md`, `Matriz_Permisos.md` |
| README con integrantes | ✅ | 5 miembros con usuario de GitHub y legajo |
| Índice de documentación | ✅ | `Documentación/README.md` enlaza todo |

## 2. Backend ✅ (funcional, con observaciones menores)

- Express 5 + TypeScript en capas (routes → controllers → services → prisma) ✅
- Prisma 7 + PostgreSQL (schema con Cliente, Servicio, Turno, Usuario, enum Rol) ✅
- JWT + bcrypt, middleware `authenticate` + `authorize` (RBAC) ✅
- Validación con Zod en todos los POST/PUT (`validate` middleware) ✅
- Manejo centralizado de errores (`errorHandler`) y 404 JSON ✅
- CORS restringido a `FRONTEND_URL` ✅
- Docker-compose con Postgres 16 + healthcheck + volúmenes ✅
- Dockerfile + `.env.example` + seed ✅
- `.http` para probar endpoints ✅

**Pendientes menores (no bloqueantes):**
1. La matriz de permisos promete `/api/auth/yo` con F5 rehidratado → ya implementado. END
2. `docker-compose` monta `prisma.config.ts` pero no existe archivo suelto: verificar que `backend/prisma.config.ts` exista (el volúmen silencioso falla). ⚠️ *Verificado: el archivo existe en `backend/`* — ok.
3. Endpoints `/api/lavados` y `/api/usuarios` están documentados en la matriz pero **no implementados** en `src/routes` (solo auth, clientes, servicios, turnos). Si el TP exige la API completa de la matriz, falta: `/api/usuarios` (GET/POST/PUT/DELETE) y `/api/lavados`. Para las pantallas `AltaUsuario`/`AltaLavado` el frontend llama endpoints que no existen todavía. ⚠️

## 3. Frontend ✅ (build pasa después de arreglar 3 errores)

- React 19 + TypeScript + Vite 8 + React Router 7 + React Bootstrap ✅
- react-hook-form + Zod en formularios ✅
- Contexto `AuthProvider` implementado con sesión rehidratada al recargar ✅
- Páginas: Home, Servicios (+alta), Vehículos (+alta), Panel, Clientes (+nuevo), PerfilCliente, Login, AltaUsuario, AltaLavado, AltaTurno ✅
- `services/api.js` centraliza fetch con token Bearer ✅
- Build de producción: **compilado OK** (458 kB JS, 139 kB gzip) ✅

**Correcciones que hice hoy para que el build pase:**
1. [App.tsx] envolví `<Layout>` con `<AuthProvider>` (estaba importado pero sin usar → error TS6133).
2. [AuthContext.tsx] quité el import de `React` sin uso y pasé `ReactNode` a import type (`verbatimModuleSyntax`).
3. [AuthContext.tsx] reemplacé `any` por `Record<string, unknown>` en `login()`.

**Pendientes menores (no bloqueantes):**
- 2 warnings de ESLint quedan en `AuthContext.tsx` (`set-state-in-effect` y fast-refresh), son estilo, no rompen nada.

## 4. Git y entrega ✅

- Repo con ramas por feature + convention commits + PRs con merges (#48, #49, #50...) ✅
- `.gitignore` bien configurado en ambos lados ✅

---

## Resumen accionable (qué falta realmente)

1. ⚠️ **Implementar `/api/usuarios` y `/api/lavados`** en backend (rutas + controller + service + validaciones Zod), porque la matriz de permisos los promete y las páginas `AltaUsuario.tsx` / `AltaLavado.tsx` hoy no tienen backend que responda.
2. ⚠️ Subir el fix de build (`App.tsx` + `AuthContext.tsx`) — sin eso el TP no compila en `npm install && npm run build` en otro equipo.
3. 📝 Opcional: agregar stock/\porcentaje en dashboard (no es requisito).

Migraciones y seed: prisma/migrations presente.
