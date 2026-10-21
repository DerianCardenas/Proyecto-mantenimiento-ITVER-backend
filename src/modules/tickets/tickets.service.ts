// ============================================================
// Tickets Service - CRUD operations for tickets
// Uses pool.query for DB operations
// All DB columns are snake_case; transforms to camelCase via snakeToCamel
// ============================================================

import { pool, withServiceClient } from '../../config/database';
import { snakeToCamel, snakeToCamelArray } from '../../utils/snakeCase';
import { Ticket, TicketDocument, TicketStatus, TicketPriority } from '../../types';

interface TicketWithDocuments extends Ticket {
  documents: TicketDocument[];
}

type DB = any;

export async function createTicket(data: {
  title: string;
  description: string;
  buildingId?: number;
  buildingName?: string;
  technicianName?: string;
  assignedTo?: string | null;
  attentionDate?: string;
  recommendations?: string;
  observations?: string;
  priority: string;
  createdBy: string;
}, db: DB = pool): Promise<Ticket> {
  const technician = data.assignedTo ? await findActiveTechnician(data.assignedTo) : null;
  if (data.assignedTo && !technician) throw new Error('El técnico seleccionado no está activo');

  const result = await db.query(
    `INSERT INTO tickets (title, description, building_id, building_name, technician_name, attention_date, recommendations, observations, priority, status, created_by, assigned_to, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10, $11, NOW(), NOW())
     RETURNING *`,
    [
      data.title,
      data.description,
      data.buildingId ?? null,
      data.buildingName ?? null,
      technician?.fullName ?? null,
      data.attentionDate ?? null,
      data.recommendations ?? null,
      data.observations ?? null,
      data.priority,
      data.createdBy,
      technician?.id ?? null,
    ]
  );

  return snakeToCamel(result.rows[0]) as unknown as Ticket;
}

export async function getTickets(filters: {
  status?: TicketStatus;
  priority?: TicketPriority;
  buildingName?: string;
  technicianName?: string;
  page?: number;
  limit?: number;
  sort?: string;
}, db: DB = pool): Promise<{ data: Ticket[]; total: number; page: number; limit: number }> {
  const { page = 1, limit = 10, sort = 'created_at DESC', ...filterParams } = filters;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (filterParams.status) {
    conditions.push(`status = $${paramIndex}`);
    values.push(filterParams.status);
    paramIndex++;
  }
  if (filterParams.priority) {
    conditions.push(`priority = $${paramIndex}`);
    values.push(filterParams.priority);
    paramIndex++;
  }
  if (filterParams.buildingName) {
    conditions.push(`building_name ILIKE $${paramIndex}`);
    values.push(`%${filterParams.buildingName}%`);
    paramIndex++;
  }
  if (filterParams.technicianName) {
    conditions.push(`technician_name ILIKE $${paramIndex}`);
    values.push(`%${filterParams.technicianName}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query(
    `SELECT COUNT(*) as total FROM tickets ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const query = `
    SELECT * FROM tickets ${whereClause} ORDER BY ${sort} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  const dataResult = await db.query(query, [...values, limit, offset]);

  const data = snakeToCamelArray(dataResult.rows) as unknown as Ticket[];

  return { data, total, page, limit };
}

export async function getTicketById(id: string, db: DB = pool): Promise<TicketWithDocuments | null> {
  const result = await db.query(
    `SELECT t.*, json_agg(
      CASE WHEN td.id IS NOT NULL THEN json_build_object(
        'id', td.id,
        'ticketId', td.ticket_id,
        'fileKey', td.file_key,
        'originalName', td.original_name,
        'mimeType', td.mime_type,
        'fileSize', td.file_size,
        'uploadedBy', td.uploaded_by,
        'uploadedAt', td.uploaded_at
      ) END
    ) as documents
    FROM tickets t
    LEFT JOIN ticket_documents td ON td.ticket_id = t.id
    WHERE t.id = $1
    GROUP BY t.id`,
    [id]
  );

  if (result.rowCount === 0) return null;

  const row = snakeToCamel(result.rows[0]) as Record<string, unknown>;
  // Handle documents array from json_agg
  const documents = (row.documents as unknown as Record<string, unknown>[]) || [];
  const cleanDocuments = documents.filter(Boolean).map((doc) => snakeToCamel(doc) as unknown as TicketDocument);

  const ticket = { ...row, documents: cleanDocuments } as unknown as TicketWithDocuments;
  return ticket;
}

export async function updateTicket(id: string, data: {
  title?: string;
  description?: string;
  buildingId?: number;
  buildingName?: string;
  technicianName?: string;
  assignedTo?: string | null;
  attentionDate?: string;
  recommendations?: string;
  observations?: string;
  priority?: string;
}, db: DB = pool): Promise<Ticket | null> {
  const existing = await getTicketById(id, db);
  if (!existing) return null;

  let technician: { id: string; fullName: string } | null | undefined;
  if (data.assignedTo !== undefined) {
    technician = data.assignedTo ? await findActiveTechnician(data.assignedTo) : null;
    if (data.assignedTo && !technician) throw new Error('El técnico seleccionado no está activo');
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.title !== undefined) {
    fields.push(`title = $${paramIndex}`);
    values.push(data.title);
    paramIndex++;
  }
  if (data.description !== undefined) {
    fields.push(`description = $${paramIndex}`);
    values.push(data.description);
    paramIndex++;
  }
  if (data.buildingId !== undefined) {
    fields.push(`building_id = $${paramIndex}`);
    values.push(data.buildingId);
    paramIndex++;
  }
  if (data.buildingName !== undefined) {
    fields.push(`building_name = $${paramIndex}`);
    values.push(data.buildingName);
    paramIndex++;
  }
  if (data.assignedTo !== undefined) {
    fields.push(`assigned_to = $${paramIndex}`);
    values.push(technician?.id ?? null);
    paramIndex++;
    fields.push(`technician_name = $${paramIndex}`);
    values.push(technician?.fullName ?? null);
    paramIndex++;
  } else if (data.technicianName !== undefined) {
    fields.push(`technician_name = $${paramIndex}`);
    values.push(data.technicianName);
    paramIndex++;
  }
  if (data.attentionDate !== undefined) {
    fields.push(`attention_date = $${paramIndex}`);
    values.push(data.attentionDate);
    paramIndex++;
  }
  if (data.recommendations !== undefined) {
    fields.push(`recommendations = $${paramIndex}`);
    values.push(data.recommendations);
    paramIndex++;
  }
  if (data.observations !== undefined) {
    fields.push(`observations = $${paramIndex}`);
    values.push(data.observations);
    paramIndex++;
  }
  if (data.priority !== undefined) {
    fields.push(`priority = $${paramIndex}`);
    values.push(data.priority);
    paramIndex++;
  }

  fields.push(`updated_at = NOW()`);

  values.push(id);
  const query = `UPDATE tickets SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

  const result = await db.query(query, values);
  return snakeToCamel(result.rows[0]) as unknown as Ticket;
}

async function findActiveTechnician(id: string): Promise<{ id: string; fullName: string } | null> {
  return withServiceClient(async (client) => {
    const result = await client.query(
      `SELECT id, full_name FROM users WHERE id = $1 AND role = 'technician' AND is_active = true`,
      [id]
    );
    return result.rowCount ? { id: result.rows[0].id, fullName: result.rows[0].full_name } : null;
  });
}

export async function deleteTicket(id: string, db: DB = pool): Promise<boolean> {
  const result = await db.query('DELETE FROM tickets WHERE id = $1 RETURNING id', [id]);
  return result.rowCount !== 0;
}

export async function updateStatus(id: string, status: TicketStatus, db: DB = pool): Promise<Ticket | null> {
  const result = await db.query(
    `UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );

  if (result.rowCount === 0) return null;
  return snakeToCamel(result.rows[0]) as unknown as Ticket;
}

export async function getStats(db: DB = pool): Promise<Record<string, unknown>> {
  const statusResult = await db.query(
    `SELECT status, COUNT(*) as count FROM tickets GROUP BY status ORDER BY status`
  );
  // COUNT(*) returns bigint (string from pg); normalize to number for the API
  const statusStats = snakeToCamelArray(statusResult.rows).map((row) => ({
    ...row,
    count: parseInt(String(row.count), 10),
  }));

  const priorityResult = await db.query(
    `SELECT priority, COUNT(*) as count FROM tickets GROUP BY priority ORDER BY priority`
  );
  const priorityStats = snakeToCamelArray(priorityResult.rows).map((row) => ({
    ...row,
    count: parseInt(String(row.count), 10),
  }));

  const buildingResult = await db.query(
    `SELECT building_name, COUNT(*) as count FROM tickets WHERE building_name IS NOT NULL GROUP BY building_name ORDER BY building_name`
  );
  const buildingStats = snakeToCamelArray(buildingResult.rows).map((row) => ({
    ...row,
    count: parseInt(String(row.count), 10),
  }));

  return {
    byStatus: statusStats,
    byPriority: priorityStats,
    byBuilding: buildingStats,
  };
}
