// ============================================================
// Documents DTOs - Zod validation schemas
// ============================================================

import { z } from 'zod';

export const UploadDocumentDto = z.object({
  ticketId: z.string().min(1, 'El ID del ticket es obligatorio'),
  file: z.any(), // Multer file object
});

export const DocumentResponseDto = z.object({
  id: z.string(),
  ticketId: z.string(),
  fileKey: z.string(),
  originalName: z.string(),
  mimeType: z.string().nullable(),
  fileSize: z.number().nullable(),
  uploadedBy: z.string().nullable(),
  uploadedAt: z.string(),
  downloadUrl: z.string(),
});

export type UploadDocumentInput = z.infer<typeof UploadDocumentDto>;
export type DocumentResponse = z.infer<typeof DocumentResponseDto>;
