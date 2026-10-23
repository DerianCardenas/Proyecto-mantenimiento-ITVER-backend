# Contrato: Iniciar sesión — Auth

## Propósito

Autenticar a un usuario activo y devolver su JWT y perfil.

## Request

- Método: `POST`
- Ruta: `/api/auth/login`
- Headers requeridos: `Content-Type: application/json`
- Body shape: `{ email: string, password: string }`
- Parámetros de query: ninguno

## Reglas de negocio

- La búsqueda se ejecuta en contexto de servicio porque todavía no existe una sesión RLS.
- La cuenta debe existir y estar activa.
- La contraseña se compara con bcrypt.
- El JWT contiene `id`, `role` y `email`.

## Response shape

`{ success: true, data: { token: string, user: UserResponse } }`.

## Casos de error conocidos

- `400/500` según el controller/middleware actual cuando las credenciales son inválidas.
- Error cuando la cuenta está desactivada.

## Archivos relacionados

- Backend: `src/modules/auth/auth.routes.ts`, `auth.controller.ts`, `auth.service.ts`, `auth.dto.ts`.
- Frontend: `src/services/auth.service.ts`, `src/stores/auth.ts` del repositorio frontend.
