// ============================================================
// Documents Controller - Express request handlers
// Handles Multer file uploads, document listing, and deletion
// ============================================================

import { Request, Response } from 'express';
import * as documentService from './documents.service';
import { successResponse, errorResponse, notFoundResponse } from '../../utils/response';

export const upload = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'Archivo requerido', 400);
    }

    const ticketId = req.params.ticketId;
    const requester = req.user as { id: string };

    const document = await documentService.uploadDocument(ticketId, req.file, requester.id, (req as any).dbClient);
    successResponse(res, document, 'Documento subido exitosamente', 201);
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al subir documento', 500);
  }
};

export const listByTicket = async (req: Request, res: Response) => {
  try {
    const ticketId = req.params.ticketId;
    const documents = await documentService.getDocumentsByTicket(ticketId, (req as any).dbClient);
    successResponse(res, documents, 'Documentos encontrados');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al listar documentos', 500);
  }
};

export const download = async (req: Request, res: Response) => {
  try {
    const { fileKey } = req.params;
    const result = await documentService.getDocument(fileKey, (req as any).dbClient);

    if (!result) {
      return notFoundResponse(res, 'Documento no encontrado');
    }

    successResponse(res, { downloadUrl: result.downloadUrl, document: result.document }, 'URL de descarga generada');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al generar URL de descarga', 500);
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const deleted = await documentService.deleteDocument(req.params.id, (req as any).dbClient);
    if (!deleted) {
      return notFoundResponse(res, 'Documento no encontrado');
    }
    successResponse(res, { id: req.params.id }, 'Documento eliminado exitosamente');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al eliminar documento', 500);
  }
};
