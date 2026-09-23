// ============================================================
// Buildings Service - Retrieve building information
// All DB columns are snake_case; transforms to camelCase via snakeToCamel
// ============================================================

import { pool } from '../../config/database';
import { snakeToCamel, snakeToCamelArray } from '../../utils/snakeCase';
import { Building } from '../../types';

type DB = any;

export async function getAll(db: DB = pool): Promise<Building[]> {
  const result = await db.query('SELECT * FROM buildings ORDER BY name ASC');
  return snakeToCamelArray(result.rows) as unknown as Building[];
}

export async function getById(id: number, db: DB = pool): Promise<Building | null> {
  const result = await db.query('SELECT * FROM buildings WHERE id = $1', [id]);

  if (result.rowCount === 0) return null;
  return snakeToCamel(result.rows[0]) as unknown as Building;
}

export async function getByName(name: string, db: DB = pool): Promise<Building | null> {
  const result = await db.query('SELECT * FROM buildings WHERE name ILIKE $1', [name]);

  if (result.rowCount === 0) return null;
  return snakeToCamel(result.rows[0]) as unknown as Building;
}