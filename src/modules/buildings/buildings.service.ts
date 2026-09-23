// ============================================================
// Buildings Service - Retrieve building information
// All DB columns are snake_case; transforms to camelCase via snakeToCamel
// ============================================================

import { pool } from '../../config/database';
import { snakeToCamel, snakeToCamelArray } from '../../utils/snakeCase';
import { Building } from '../../types';

export async function getAll(): Promise<Building[]> {
  const result = await pool.query('SELECT * FROM buildings ORDER BY name ASC');
  return snakeToCamelArray(result.rows) as unknown as Building[];
}

export async function getById(id: number): Promise<Building | null> {
  const result = await pool.query('SELECT * FROM buildings WHERE id = $1', [id]);

  if (result.rowCount === 0) return null;
  return snakeToCamel(result.rows[0]) as unknown as Building;
}

export async function getByName(name: string): Promise<Building | null> {
  const result = await pool.query('SELECT * FROM buildings WHERE name ILIKE $1', [name]);

  if (result.rowCount === 0) return null;
  return snakeToCamel(result.rows[0]) as unknown as Building;
}
