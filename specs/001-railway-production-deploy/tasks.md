# Tasks: Despliegue productivo en Railway

## Estado general: 🔄 En progreso

## Backend y base de datos

- [x] Convertir `Dockerfile` a build multietapa que compile TypeScript.
- [x] Implementar runner de migraciones con ledger, advisory lock y preflight.
- [x] Implementar provisión del rol `sgm_app` y privilegios mínimos.
- [x] Implementar seed compilado, idempotente y sin secretos por defecto en producción.
- [x] Actualizar scripts de `package.json` y `.env.example`.
- [x] Crear archivos SQL de soporte y rollback documental.
- [x] Validar build e imagen desde un contexto limpio.
- [x] Probar migración inicial y segunda ejecución sin cambios.

## Frontend

- [x] Confirmar build productivo con `VITE_API_URL` definido.
- [ ] Configurar variables y dominio público en Railway.
- [ ] Validar fallback SPA y llamadas al backend.

## Principal (post-integración)

- [ ] Configurar referencias PostgreSQL y secretos del backend en Railway.
- [ ] Configurar pre-deploy, healthcheck y dominio del backend.
- [ ] Sincronizar `VITE_API_URL` y `CORS_ORIGIN`.
- [ ] Confirmar migraciones, seed y rol `sgm_app` en Railway.
- [ ] Smoke test de `/health`, login y flujo autenticado.
- [ ] Revisar si surgieron convenciones para `AGENTS.md`.
- [ ] Actualizar specs y hallazgos con el resultado real.
- [ ] Crear commits de ambos repositorios y enviar `main`.

## Documentación

- [x] Crear `spec.md`.
- [x] Crear `plan.md`.
- [x] Crear `tasks.md`.
- [x] Crear ADR-001.
- [x] Confirmar que no cambia el contrato HTTP.

## Pendiente (fuera de scope)

- [ ] Configurar almacenamiento S3 para adjuntos si se proporcionan credenciales reales o se autoriza crear un bucket Railway.
- [ ] Remediar upgrades de dependencias reportados por `npm audit` en una spec separada.
