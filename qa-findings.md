# QA Findings — SGM-ITVER backend

## Anti-patrones recurrentes

| Patrón | Frecuencia | Riesgo | Archivos ejemplo |
|--------|------------|--------|------------------|
| Imagen Docker inicia `dist/index.js` sin etapa de compilación | alta en despliegue | El contenedor entra en crash loop | `Dockerfile` |
| Bootstrap SQL destructivo usado como comando de migración | alta en despliegue | Pérdida de datos si se reutiliza en una BD inicializada | `migrations/001_initial_schema.sql`, `package.json` |
| Variables con fallbacks inseguros | media | Un despliegue incompleto intenta usar credenciales conocidas o localhost | `src/config/database.ts`, `src/config/auth.ts`, `scripts/seed.ts` |
| Scripts operativos fuera del build TypeScript | media | No están disponibles en una imagen de producción sin `tsx` | `scripts/*.ts`, `tsconfig.json` |
| Upload de Multer sin límite configurado | baja | Consumo excesivo de memoria ante archivos grandes | `src/modules/documents/documents.routes.ts` |

## Deuda técnica identificada

- [ ] Actualizar Multer 1.x y revisar las alertas de seguridad de dependencias.
- [ ] Aplicar un límite real de 10 MB en Multer, no solo validación de tipo.
- [ ] Eliminar fallbacks de secretos en modo producción.
- [ ] Añadir pruebas automatizadas para RLS, autenticación y migraciones.
- [ ] Revisar `snakeToCamel` para valores anidados no planos y fechas.

## Áreas sin cobertura de tests

- Autenticación y política de cambio obligatorio de contraseña.
- Visibilidad y mutaciones protegidas por RLS.
- CRUD y estadísticas de tickets.
- Upload/download de documentos S3.
- Migraciones y bootstrap de una base vacía.
