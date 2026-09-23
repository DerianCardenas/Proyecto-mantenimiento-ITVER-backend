// ============================================================
// Documents Controller - Express request handlers
// Handles Multer file uploads, document listing, and deletion
// ============================================================

import { Request, Response } from 'express';
import * as documentService from './documents.service';
import { successResponse, errorResponse, notFoundResponse } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';

export const upload = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      return errorResponse(res, 'Archivo requerido', 400);
    }

    const ticketId = req.params.ticketId;
    const requester = req.user as { id: string };

    const document = await documentService.uploadDocument(ticketId, req.file, requester.id);
    successResponse(res, document, 'Documento subido exitosamente', 201);
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al subir documento', 500);
  }
};

export const listByTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = req.params.ticketId;
    const documents = await documentService.getDocumentsByTicket(ticketId);
    successResponse(res, documents, 'Documentos encontrados');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al listar documentos', 500);
  }
};

export const download = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileKey } = req.params;
    const result = await documentService.getDocument(fileKey);

    if (!result) {
      return notFoundResponse(res, 'Documento no encontrado');
    }

    successResponse(res, { downloadUrl: result.downloadUrl, document: result.document }, 'URL de descarga generada');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al generar URL de descarga', 500);
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await documentService.deleteDocument(req.params.id);
    if (!deleted) {
      return notFoundResponse(res, 'Documento no encontrado');
    }
    successResponse(res, { id: req.params.id }, 'Documento eliminado exitosamente');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al eliminar documento', 500);
  }
};
