# Spec: Despliegue productivo de backend y PostgreSQL en Railway

## Contexto

El servicio Railway `captivating-tenderness` despliega `DerianCardenas/Proyecto-mantenimiento-ITVER-backend` desde `main` mediante el Dockerfile del repositorio. PostgreSQL está en línea pero no contiene tablas. El servicio backend no tiene variables propias, dominio público ni healthcheck configurado.

## Impacto estimado

- Alcance: imagen del backend, bootstrap/migraciones, seed inicial y configuración productiva de Railway.
- Riesgo: alto — incluye creación del esquema y credenciales de base de datos, aunque la instancia actual está vacía.
- Usuarios afectados: todos los usuarios de la futura instancia productiva.
- Dependencias: servicio PostgreSQL de Railway, frontend público y credenciales S3 para adjuntos.

## Problema

Railway construye una imagen que instala solo dependencias de producción y luego ejecuta `node dist/index.js`. El Dockerfile nunca ejecuta TypeScript, por lo que `dist/index.js` no existe y el contenedor entra en crash loop. Además, el backend no puede conectarse al PostgreSQL de Railway porque no tiene variables configuradas y la base todavía no está inicializada.

## Causa raíz

- El Dockerfile tiene una sola etapa con `npm ci --only=production`, copia el código fuente y arranca un artefacto que no construyó.
- No existe un runner de migraciones disponible dentro de la imagen productiva; el comando actual depende del binario externo `psql` y omite la migración 003.
- La migración 001 es un bootstrap destructivo y no tiene un ledger que impida volver a ejecutarla.
- La aplicación contiene fallbacks de desarrollo que no deben usarse en Railway.

## Solución propuesta

### Backend

- Convertir el Dockerfile en un build multietapa: instalar dependencias completas, compilar, y copiar `dist`, migraciones y dependencias productivas a la imagen final.
- Añadir un runner Node/TypeScript compilado que use la conexión administrativa `DATABASE_URL`, mantenga un ledger y rechace una base parcialmente inicializada sin historial.
- Aplicar 001–003 una sola vez sobre la instancia vacía, crear/actualizar el rol `sgm_app` sin superusuario ni bypass de RLS y otorgar privilegios mínimos.
- Hacer idempotente el seed inicial y exigir contraseñas explícitas en producción.
- Configurar referencias a PostgreSQL, JWT, CORS, seed y entorno en Railway; añadir dominio público y healthcheck `/health`.

### Frontend

- No se cambia el contrato de API.
- El frontend deberá compilar con la URL pública de este backend y el backend aceptará exactamente el origen público del frontend.

## Análisis de impacto

El cambio no modifica endpoints ni shapes JSON. Sí modifica el ciclo de vida del despliegue: las migraciones y el seed se ejecutarán antes de iniciar una nueva versión. El runner usará credenciales administrativas únicamente en pre-deploy; el proceso HTTP usará `sgm_app`. Las funciones de documentos seguirán dependiendo de credenciales S3 válidas.

## Archivos que se van a modificar

| Archivo | Tipo de cambio | Capa |
|---------|----------------|------|
| `Dockerfile` | modificar | backend/infra |
| `.dockerignore` | nuevo | infraestructura |
| `package.json` | modificar | backend/infra |
| `.env.example` | modificar | configuración |
| `src/config/database.ts` | modificar | backend/BD |
| `src/config/auth.ts` | modificar | backend/seguridad |
| `src/scripts/migrate.ts` | nuevo | BD/infra |
| `src/scripts/seed.ts` | nuevo | BD/infra |
| `specs/001-railway-production-deploy/original_railway_database.sql` | nuevo | BD |
| `specs/001-railway-production-deploy/create_railway_bootstrap.sql` | nuevo | BD |
| configuración del servicio Railway | modificar | infraestructura |
