# Memoria de trabajo — SGM-ITVER Backend

Actualizada: 2026-10-26. Este archivo registra el estado operativo verificado en producción y decisiones clave del proyecto.

## Estado en producción (Railway)
- **Servicio Backend**: Publicado y activo en `https://captivating-tenderness-production-6777.up.railway.app/api`.
- **Base de datos**: PostgreSQL administrada en Railway.
- **Seguridad y Runtime**:
  - `Dockerfile` configurado en multi-etapa con **`node:22.23.4-alpine`** (actualizado el 2026-10-26 desde `node:20-alpine` tras la alerta crítica CVE-2026-111497 / Brotli RCE).
  - Archivo `.node-version` fijado en `22.23.4`.
  - El contenedor corre bajo el usuario de bajo privilegio `sgm_app` con permisos estrictos de RLS.
- **Pre-deploy**: Migraciones transaccionales (`db:migrate:prod`) y seed idempotente (`db:seed:prod`).
- **Healthcheck**: Endpoint `/health` validado por Railway antes de conmutar tráfico.
- **CORS**: Enlazado con el frontend de producción `https://hearty-caring-production.up.railway.app`.

## Frontend relacionado
- Repositorio hermano `../Proyecto-mantenimiento-ITVER`.
- Desplegado en Railway con Railpack (`https://hearty-caring-production.up.railway.app`) y `.node-version` `22.23.4`.
