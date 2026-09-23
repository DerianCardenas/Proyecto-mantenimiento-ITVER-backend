// ============================================================
// Documents Service - Upload, retrieve, and delete documents
// Uses Backblaze B2 S3 client for file storage
// Stores metadata in PostgreSQL, files in S3-compatible storage
// ============================================================

import { pool } from '../../config/database';
import { s3Client, s3Bucket, generateFileKey, getPresignedUrl } from '../../config/s3';
import { snakeToCamel, snakeToCamelArray } from '../../utils/snakeCase';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { TicketDocument } from '../../types';

type DB = any;

export async function uploadDocument(
  ticketId: string,
  file: Express.Multer.File,
  userId: string,
  db: DB = pool
): Promise<TicketDocument> {
  const fileKey = generateFileKey(file.originalname, ticketId);

  // Upload file to S3 (Backblaze B2)
  const uploadParams = {
    Bucket: s3Bucket,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await s3Client.send(new PutObjectCommand(uploadParams));

  // Store metadata in database
  const result = await db.query(
    `INSERT INTO ticket_documents (ticket_id, file_key, original_name, mime_type, file_size, uploaded_by, uploaded_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
    [ticketId, fileKey, file.originalname, file.mimetype || null, file.size || null, userId]
  );

  return snakeToCamel(result.rows[0]) as unknown as TicketDocument;
}

export async function getDocumentsByTicket(ticketId: string, db: DB = pool): Promise<TicketDocument[]> {
  const result = await db.query(
    `SELECT * FROM ticket_documents WHERE ticket_id = $1 ORDER BY uploaded_at DESC`,
    [ticketId]
  );

  return snakeToCamelArray(result.rows) as unknown as TicketDocument[];
}

export async function getDocument(fileKey: string, db: DB = pool): Promise<{ document: TicketDocument; downloadUrl: string } | null> {
  const result = await db.query(
    `SELECT * FROM ticket_documents WHERE file_key = $1`,
    [fileKey]
  );

  if (result.rowCount === 0) return null;

  const document = snakeToCamel(result.rows[0]) as unknown as TicketDocument;
  const downloadUrl = await getPresignedUrl(fileKey);

  return { document, downloadUrl };
}

export async function deleteDocument(id: string, db: DB = pool): Promise<boolean> {
  const docResult = await db.query('SELECT file_key FROM ticket_documents WHERE id = $1', [id]);

  if (docResult.rowCount === 0) return false;

  const fileKey = docResult.rows[0].file_key;

  // Delete from S3
  await s3Client.send(new DeleteObjectCommand({
    Bucket: s3Bucket,
    Key: fileKey,
  }));

  // Delete from DB (cascade handles this if FK is set up, but we do it explicitly)
  await db.query('DELETE FROM ticket_documents WHERE id = $1', [id]);

  return true;
}
