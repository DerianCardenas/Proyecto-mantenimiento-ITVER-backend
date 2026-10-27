# ADR 0001 — Usar `pdfjs-dist` para importar solicitudes PDF

- Fecha: 2026-10-26
- Estado: Aceptado

## Contexto

Se agregó la importación de tickets a partir del PDF "Solicitud de
Mantenimiento Correctivo" (formato ITVER). El backend no tenía ninguna
librería para extraer texto de PDFs. `AGENTS.md` exige registrar un ADR
antes de introducir una dependencia nueva.

## Decisión

Usar `pdfjs-dist` (build legacy CommonJS, sin binarios nativos) para
extraer el texto del PDF en memoria. El parseo vive en
`modules/tickets/ticketsImport.service.ts` y se expone en
`POST /api/tickets/import/parse` (solo `admin`, Multer en memoria, límite
10 MB). El endpoint **no persiste**: devuelve los campos sugeridos para
que el frontend los revise y luego cree el ticket con el CRUD existente y
adjunte el PDF.

## Alternativas consideradas

- `pdf-parse`: se descartó porque empaqueta un pdf.js antiguo que falla al
  leer el formato real de solicitud (`FormatError: bad XRef entry`), pese a
  que el PDF es válido para parsers modernos.
- Parsear en el frontend con `pdfjs`: mezcla lógica de dominio en la UI y
  el navegador tendría que reenviar texto no confiable.

## Consecuencias

- El contenido extraído depende del layout del formato; el parseo es
  best-effort y por eso el flujo exige una revisión manual antes de crear.
- Se usa el subpath `pdfjs-dist/legacy/build/pdf.js` vía `require`, tipado
  como `any` porque ese subpath no expone sus tipos.
