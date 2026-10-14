# Índice de Documentación — SGI San José (Grupo 4)

Repositorio: `Bautistapuertas/Lubricentro-San-Jose`
Ramas activas: `master`
Fecha de consolidación: 2026-10-14

---

## 00 Visión y Alcance
* **Producto:** [Documento de Visión y Alcance del SGI San José (PDF)](./00%20Documento%20de%20Visión%20y%20Alcance/Vision_y_Alcance_SGI_SanJose.pdf).

## 01 Análisis Inicial
* **1.1 Alcance, módulos y límites:** definición de objetivos y fronteras del sistema.
* **1.2 Glosario de términos:** definiciones comunes del dominio.
* **Diagrama Contextual:** [Diagrama Contextual del Sistema](./01%20-%20Análisis%20Inicial/Diagrama%20Contextual.jpeg).

## 02 Modelado de Dominio
* **2.1 Modelo de Dominio:** representación conceptual de las entidades del sistema ([Entidades.md](./02%20-%20Modelado%20de%20Dominio/Entidades.md)).
* **2.2 Requisitos Funcionales:** detalle de capacidades ([Fase 2.pdf](./02%20-%20Modelado%20de%20Dominio/Fase%202.pdf)).
* **2.3 Reglas de Negocio:** normas y lógica operativa del lavadero y lubricentro.
* **2.4 Diagramas Complementarios:** diagramas de estado y flujos de gestión ([Diagrama de Estado](./02%20-%20Modelado%20de%20Dominio/Diagrama%20de%20Estado.jpeg)).

## 03 Backlog
* **3.1 Épicas y Features:** listado ordenado y priorizado ([Epicas-y-Features.png](./03-Backlog/Epicas-y-Features.png)).
* **3.2 Historias de Usuario:** funcionalidades con criterios de aceptación ([Historias_de_Usuario.pdf](./03-Backlog/Historias_de_Usuario.pdf)).
* **3.3 División de historias:** unidades de trabajo con estimación y prioridad.
* **3.4 Calendario de planificación:** hoja de ruta y cronograma de sprints ([Calendario de Planificación.pdf](./03-Backlog/Calendario%20de%20Planificación.pdf)).

## 04 UX/UI
* **Solicitud de Turnos - Vista Cliente:** [01_Wireframe_Reserva_Cliente.png](./04%20UX-UI/01_Wireframe_Reserva_Cliente.png)
* **Agenda Operativa - Vista Administrador:** [02_Wireframe_Agenda_Admin.png](./04%20UX-UI/02_Wireframe_Agenda_Admin.png)
* **Registro de Ficha Técnica - Vista Operativa:** [03_Wireframe_Ficha_Tecnica.png](./04%20UX-UI/03_Wireframe_Ficha_Tecnica.png)

## 05 Diseño de API
* **Listado de Operaciones:** mapeo de pantallas a operaciones y entidades ([Operaciones.md](./05%20-%20Diseño%20de%20API/Operaciones.md)).
* **Contrato de API REST:** endpoints para Servicios, Clientes, Vehículos, Turnos, Lavados y Usuarios.
* **Matriz de Permisos (RBAC):** control de acceso por endpoint para roles ADMIN, EMPLEADO, CLIENTE y Público ([Matriz_Permisos.md](./05%20-%20Diseño%20de%20API/Matriz_Permisos.md)).

## 06 Arquitectura e Infraestructura
* **Implementación:** [README de Infraestructura](./06%20-%20Arquitectura%20e%20Infraestructura/README_INFRAA.md)
* **Dockerfile del backend:** [Dockerfile backend](./06%20-%20Arquitectura%20e%20Infraestructura/Dockerfile_backend.md)
* **Dockerfile del frontend:** [Dockerfile frontend](./06%20-%20Arquitectura%20e%20Infraestructura/Dockerfile_frontend.md)
* **docker-compose.yml:** [compose](./06%20-%20Arquitectura%20e%20Infraestructura/docker-compose.yml)
* **render.yaml:** [render.yaml](./06%20-%20Arquitectura%20e%20Infraestructura/render.yaml)
* **Variables de entorno:** [.env.example backend](./06%20-%20Arquitectura%20e%20Infraestructura/.env.example)

## 07 Entregables
* **Reporte de cumplimiento:** [Informe de cumplimiento TP](./07%20-%20Entregables/Informe_CUMPLIMIENTO.md)
* **Informe de actualización de infraestructura:** [Informe de actualiz. INFRAA](./07%20-%20Entregables/Informe_INFRAA.md)
* **Resumen de entregables:** [Resumen_Entregables.md](./07%20-%20Entregables/Resumen_Entregables.md)

---

## Cómo navegar este repo

```text
Lubricentro-San-Jose/
├── 00 Documento de Visión y Alcance/
├── 01 - Análisis Inicial/
├── 02 - Modelado de Dominio/
├── 03-Backlog/
├── 04 UX-UI/
├── 05 - Diseño de API/
├── 06 - Arquitectura e Infraestructura/
├── 07 - Entregables/
├── backend/          # Express + TypeScript + PostgreSQL (API)
├── frontend/         # React + Vite + React Bootstrap (SPA)
├── docker-compose.yml
├── render.yaml
└── README.md
```

## Reglas de entrega

| Regla | Aplicación |
|---|---|
| Máximo 3 entregables | TP1, TP2, TP3 |
| MVP (TP2) | Entrega 2 con funcionalidades mínimas viables |
| Fecha de entrega | 15 de octubre de 2026 |
| Formato | Markdown en esta carpeta `docs/` |
| Código fuente | Solo en `backend/` y `frontend/` |
| Binarios | `node_modules/`, `dist/`, `.env` no deben subirse al repositorio |

## Guías de uso

* **[Guía de exposición: Clientes y Vehículos como entidades reales](./guia-exposicion-entidades.md)** — fundamentos de la normalización elegida para el TP.
* **[Informe de actualización de infraestructura (INFRAA)](./07%20-%20Entregables/Informe_INFRAA.md)** — historia de la infraestructura, errores detectados, arreglos y verificación.
* **[README del backend](./06%20-%20Arquitectura%20e%20Infraestructura/README_backend.md)** — endpoints, seguridad y despliegue.
* **[README del frontend](./06%20-%20Arquitectura%20e%20Infraestructura/README_frontend.md)** — componentes, rutas y estilos.
