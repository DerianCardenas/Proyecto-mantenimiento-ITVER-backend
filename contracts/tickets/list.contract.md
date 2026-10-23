# Contrato: Listar tickets — Tickets

## Propósito

Devolver la lista paginada de tickets visibles para el usuario autenticado.

## Request

- Método: `GET`
- Ruta: `/api/tickets`
- Headers requeridos: `Authorization: Bearer <jwt>`
- Body shape: ninguno
- Parámetros de query: `status`, `priority`, `buildingName`, `technicianName`, `page`, `limit`, `sort` y filtros de fecha admitidos por el service.

## Reglas de negocio

- El JWT debe ser válido y un técnico no puede tener cambio de contraseña pendiente.
- `dbContext` establece el usuario y rol de PostgreSQL para que RLS filtre las filas.
- El cliente de la petición debe usarse en todas las consultas de datos y conteo.

## Response shape

`{ success: true, data: Ticket[], total, page, limit, totalPages, message? }` con campos de ticket en camelCase.

## Casos de error conocidos

- `401` si falta o es inválido el JWT.
- `403` si el técnico debe cambiar la contraseña.
- `503` si PostgreSQL no está disponible.
- `500` para errores no controlados.

## Archivos relacionados

- Backend: `src/modules/tickets/tickets.routes.ts`, `tickets.controller.ts`, `tickets.service.ts`, `tickets.dto.ts`.
- Frontend: `src/services/ticket.service.ts`, `src/stores/tickets.ts` del repositorio frontend.
