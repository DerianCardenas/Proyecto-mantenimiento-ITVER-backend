import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { withServiceClient } from '../../config/database';
import { snakeToCamel } from '../../utils/snakeCase';
import { UserResponse } from '../../types';
import { CreateTechnicianInput, UpdateTechnicianInput } from './technicians.dto';

const SALT_ROUNDS = 12;
const TECHNICIAN_FIELDS = 'id, username, email, role, full_name, is_active, must_change_password, created_at';

function toTechnician(row: Record<string, unknown>): UserResponse {
  const user = snakeToCamel(row) as Record<string, unknown>;
  return {
    id: user.id as string,
    username: user.username as string,
    email: user.email as string,
    role: user.role as string,
    fullName: user.fullName as string,
    isActive: user.isActive as boolean,
    mustChangePassword: user.mustChangePassword as boolean,
    createdAt: user.createdAt as string,
  };
}

export async function listTechnicians(includeInactive = false): Promise<UserResponse[]> {
  const result = await withServiceClient((client) => client.query(
    `SELECT ${TECHNICIAN_FIELDS} FROM users
     WHERE role = 'technician' AND ($1::boolean OR is_active = true)
     ORDER BY lower(full_name), full_name`,
    [includeInactive]
  ));

  return result.rows.map(toTechnician);
}

export async function createTechnician(data: CreateTechnicianInput): Promise<UserResponse> {
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const username = `tec_${randomUUID().replace(/-/g, '').slice(0, 20)}`;
  const result = await withServiceClient((client) => client.query(
    `INSERT INTO users (username, email, password_hash, role, full_name, is_active, must_change_password, created_at, updated_at)
     VALUES ($1, $2, $3, 'technician', $4, true, true, NOW(), NOW())
     RETURNING ${TECHNICIAN_FIELDS}`,
    [username, data.email.toLowerCase(), passwordHash, data.fullName]
  ));

  return toTechnician(result.rows[0]);
}

export async function updateTechnician(id: string, data: UpdateTechnicianInput): Promise<UserResponse | null> {
  const passwordHash = data.password ? await bcrypt.hash(data.password, SALT_ROUNDS) : null;
  const result = await withServiceClient((client) => client.query(
    `UPDATE users
     SET full_name = COALESCE($1, full_name),
         email = COALESCE($2, email),
         is_active = COALESCE($3, is_active),
         password_hash = COALESCE($4, password_hash),
         must_change_password = CASE WHEN $4 IS NOT NULL THEN true ELSE must_change_password END,
         updated_at = NOW()
     WHERE id = $5 AND role = 'technician'
     RETURNING ${TECHNICIAN_FIELDS}`,
    [data.fullName ?? null, data.email?.toLowerCase() ?? null, data.isActive ?? null, passwordHash, id]
  ));

  return result.rowCount ? toTechnician(result.rows[0]) : null;
}

export async function deactivateTechnician(id: string): Promise<UserResponse | null> {
  const result = await withServiceClient((client) => client.query(
    `UPDATE users SET is_active = false, updated_at = NOW()
     WHERE id = $1 AND role = 'technician'
     RETURNING ${TECHNICIAN_FIELDS}`,
    [id]
  ));

  return result.rowCount ? toTechnician(result.rows[0]) : null;
}
