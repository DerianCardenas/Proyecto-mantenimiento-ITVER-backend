# AGENTS.md — SGM-ITVER backend

> Última actualización: 2026-10-22
> Generado con: context-generator

---

## Para Codex y agentes: leer esto primero

Antes de cualquier tarea en este proyecto:
1. Leer este archivo completo.
2. Verificar que el plan respeta las convenciones y restricciones documentadas.
3. Reportar conflictos entre código y documentación antes de actuar.
4. No introducir librerías, patrones o herramientas no documentados sin crear un ADR.

---

## Dominio

SGM-ITVER digitaliza la recepción y seguimiento de solicitudes de mantenimiento del Instituto Tecnológico de Veracruz. Permite registrar tickets, asignarlos a técnicos, dar seguimiento al estado y adjuntar documentos SISAD. Administradores gestionan técnicos y consultan el panorama completo; los demás usuarios acceden según las políticas de seguridad de cada registro.

---

## Stack técnico

### Backend
- Runtime: Node.js 20 en el contenedor de producción.
- Framework: Express 4.22.3 con TypeScript 5.9.3 en modo estricto.
- Base de datos: PostgreSQL 16 en Railway.
- Acceso a datos: consultas SQL parametrizadas directas mediante `pg` 8.23.0; no hay ORM.
- Autenticación: JWT en header Bearer y contraseñas bcrypt con 12 rondas.
- Librerías críticas: Zod para validación, Multer para uploads en memoria y AWS SDK S3 para Backblaze B2.

### Frontend
- Runtime: Node.js durante el build; artefacto estático Vite en producción.
- Framework: Vue 3.5.43 + Vite 5.4.21 + TypeScript 5.9.3.
- Estado: Pinia 2.3.1.
- Cliente HTTP: instancia Axios en el repositorio hermano `Proyecto-mantenimiento-ITVER/src/services/api.ts`.
- Librerías críticas: Vue Router y PrimeVue.

---

## Convenciones

### Naming
- TypeScript, JSON y API usan `camelCase`; PostgreSQL usa `snake_case`.
- Cada módulo de API agrupa `*.routes.ts`, `*.controller.ts`, `*.service.ts` y `*.dto.ts`.
- Componentes Vue usan PascalCase y los servicios/composables usan camelCase.

### Estructura de requests y responses
- Las respuestas normales usan `{ success, data?, message?, error? }`.
- Las listas paginadas agregan `total`, `page`, `limit` y `totalPages`.
- Las filas de PostgreSQL se transforman a camelCase antes de salir por la API.
- Los errores esperados deben usar `AppError`; el middleware global serializa el envelope de error.

### Headers
- Toda ruta protegida requiere `Authorization: Bearer <jwt>`.
- Uploads usan `multipart/form-data` con el campo `file`; el cliente no debe fijar manualmente el boundary.

### Valores constantes
- Roles: `admin`, `technician`, `receptionist`.
- Estados de ticket: `pending`, `in_progress`, `resolved`, `closed`, `cancelled`.
- Prioridades: `low`, `medium`, `high`, `urgent`.
- El límite funcional documentado para PDFs es 10 MB; verificar que Multer lo aplique antes de depender de él.

### Ramas y commits
- Rama base y de despliegue: `main`.
- Los repositorios actuales usan mensajes libres, breves y principalmente en español.
- Para specs nuevas, usar `tipo(scope): NNN-nombre — descripción breve`.

---

## Anti-patrones conocidos

- NO consultar tablas protegidas mediante el `pool` global dentro de una petición; usar `req.dbClient`/`getDb(req)` para conservar el contexto RLS.
- NO ejecutar `migrations/001_initial_schema.sql` contra una base con datos: contiene `DROP TABLE` y `DROP TYPE`.
- NO desplegar una imagen que ejecute `dist/index.js` sin compilar TypeScript dentro del build.
- NO conservar secretos o contraseñas de ejemplo de `.env.example` en Railway.
- NO usar el usuario PostgreSQL administrador como identidad de ejecución de la aplicación; los superusuarios omiten RLS.
- NO usar `SET LOCAL app.x = $1`; PostgreSQL no admite parámetros bind ahí. Usar `set_config`.

---

## Restricciones del dominio

- La información productiva de tickets y documentos debe preservarse; todas las migraciones posteriores al bootstrap son incrementales.
- RLS debe permanecer habilitado y forzado en `users`, `buildings`, `tickets` y `ticket_documents`.
- Login y operaciones previas a una sesión usan `withServiceClient`; no ampliar ese bypass a tickets o documentos.
- Backblaze B2 es la dependencia externa para adjuntos. Sin credenciales válidas, el API principal puede iniciar, pero upload/download no quedan operativos.
- Frontend y backend son repositorios y servicios de Railway separados; ambos despliegan desde `main`.

---

## Mapa de módulos

```
src/
├── index.ts              ← carga entorno, verifica PostgreSQL e inicia HTTP
├── app.ts                ← middlewares, healthcheck y montaje de rutas
├── config/               ← PostgreSQL, JWT y S3
├── middleware/           ← auth, RLS por petición, validación y errores
├── modules/
│   ├── auth/             ← login, perfil, contraseñas y usuarios
│   ├── technicians/      ← administración de técnicos
│   ├── tickets/          ← CRUD, filtros y estadísticas
│   ├── documents/        ← metadatos y almacenamiento S3
│   └── buildings/        ← catálogo de edificios
├── types/                ← contratos TypeScript comunes
└── utils/                ← envelopes y transformación snake/camel
migrations/               ← SQL versionado; 001 es solo bootstrap vacío
scripts/                  ← utilidades manuales existentes
contracts/                ← contratos de integración documentados
specs/                    ← specs de cambios
```

---

## Recetas frecuentes

### Crear un endpoint nuevo
1. Definir DTO/validator en el módulo.
2. Implementar SQL parametrizado en el service.
3. Pasar `getDb(req)` desde el controller si la tabla usa RLS.
4. Declarar la ruta estática antes de rutas dinámicas como `/:id`.
5. Responder mediante los helpers de `utils/response.ts` y compilar con `npm run build`.

### Agregar una migración
1. Crear el siguiente archivo numérico en `migrations/` sin modificar migraciones aplicadas.
2. Hacer el SQL transaccional o idempotente cuando sea posible.
3. Probar sobre una base vacía y una base ya inicializada.
4. Registrar la migración en el runner; nunca reutilizar 001 para una actualización.

### Trabajar con una consulta protegida por RLS
1. Mantener `authMiddleware → requirePasswordChanged → dbContext`.
2. Obtener el cliente desde la petición.
3. Ejecutar todas las consultas de esa petición con ese cliente.
4. Reservar `withServiceClient` para autenticación y tareas administrativas explícitas.

### Validar un despliegue
1. Ejecutar `npm ci` y `npm run build`.
2. Construir la imagen desde un contexto limpio sin `dist/` local.
3. Aplicar migraciones con credenciales administrativas y ejecutar la app con `sgm_app`.
4. Validar `/health`, login, CRUD básico, RLS y CORS desde el frontend público.

---

## ADRs registrados

| ID | Decisión | Fecha | Archivo |
|----|----------|-------|---------|
| — | No hay ADR formal previo | — | — |

---

## Historial de actualizaciones

| Fecha | Sección | Cambio |
|-------|---------|--------|
| 2026-10-22 | Todas | Contexto inicial levantado desde código y configuración de Railway. |
