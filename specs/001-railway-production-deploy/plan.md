# Plan técnico: Despliegue productivo de backend y PostgreSQL en Railway

## Flujo de datos

1. Un push a `main` dispara el build Docker.
2. La etapa de build ejecuta `npm ci` y `npm run build`.
3. La imagen final recibe dependencias productivas, `dist/` y `migrations/`.
4. Railway ejecuta antes del deploy el runner compilado:
   - conecta como administrador mediante `DATABASE_URL`;
   - toma un advisory lock;
   - crea `schema_migrations` si no existe;
   - si no hay ledger, verifica que no existan tablas del dominio;
   - aplica 001, 002 y 003 dentro de transacciones y registra cada versión;
   - crea o actualiza `sgm_app` con `NOSUPERUSER NOBYPASSRLS`;
   - otorga permisos sobre schema, tablas, secuencias y funciones.
5. El seed crea usuarios iniciales solo si no existen y solo con secretos explícitos.
6. El proceso HTTP conecta con `DB_USER=sgm_app`, escucha `PORT` y expone `/health`.
7. Railway valida `/health` antes de sustituir el deploy anterior.

## Decisiones técnicas

- La imagen seguirá usando Docker porque el repositorio ya declara ese mecanismo y Railway lo detecta automáticamente.
- El contexto Docker excluirá dependencias, artefactos y secretos locales para que la prueba reproduzca un checkout de GitHub.
- El runner se implementará con `pg`, ya existente, para no instalar `psql` en la imagen ni introducir otra herramienta de migración. La decisión se registra en `adr-001.md`.
- `DATABASE_URL` será exclusiva de migraciones administrativas. El servidor continuará usando `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD` para separar la identidad de runtime.
- Ante tablas existentes sin ledger, el runner abortará. No intentará adivinar el estado ni ejecutar la migración destructiva 001.
- El seed no tendrá contraseñas por defecto en producción y será idempotente.

## Configuración Railway prevista

- Backend:
  - `DATABASE_URL=${{Postgres.DATABASE_URL}}`
  - `DB_HOST=${{Postgres.PGHOST}}`
  - `DB_PORT=${{Postgres.PGPORT}}`
  - `DB_NAME=${{Postgres.PGDATABASE}}`
  - `DB_USER=sgm_app`
  - `DB_PASSWORD=<secreto fuerte para sgm_app>`
  - `JWT_SECRET=<secreto fuerte>`
  - `JWT_EXPIRES_IN=86400`
  - `NODE_ENV=production`
  - `CORS_ORIGIN=https://<dominio-frontend>`
  - secretos del seed inicial.
- Pre-deploy: migración seguida del seed idempotente.
- Healthcheck: `/health`.
- Networking: dominio público HTTPS generado por Railway.

Las variables S3 se configurarán solo con credenciales reales; nunca con los valores de ejemplo.

## Verificación

- Build local desde dependencias limpias.
- Build de imagen desde un checkout sin `dist/`.
- Prueba del runner sobre PostgreSQL vacío y segunda ejecución sin cambios.
- Confirmar tablas, políticas RLS, rol `sgm_app` y seed.
- Verificar despliegue `SUCCESS`, `/health`, login y una consulta protegida.
- Comprobar que un técnico no puede ver tickets ajenos.

## Hallazgos durante implementación

- Pendiente de completar durante la implementación.

## Archivos involucrados

| Archivo | Tipo de cambio |
|---------|----------------|
| `Dockerfile` | build multietapa y runtime mínimo |
| `.dockerignore` | excluir artefactos y archivos locales del contexto |
| `package.json` | scripts operativos compilados |
| `.env.example` | separar conexión administrativa y runtime |
| `src/config/database.ts` | validación productiva de configuración |
| `src/config/auth.ts` | exigir un secreto JWT real en producción |

## Resultado ejecutado

El plan se completó en Railway. El contenedor escucha en el `PORT=8080` inyectado por la plataforma, las migraciones y el seed corren como pre-deploy y el runtime usa `sgm_app`. El dominio productivo validado es `https://captivating-tenderness-production-6777.up.railway.app`.
| `src/scripts/migrate.ts` | runner con ledger, lock y provisión de rol |
| `src/scripts/seed.ts` | seed idempotente sin defaults productivos |
| Railway | variables, pre-deploy, dominio y healthcheck |
