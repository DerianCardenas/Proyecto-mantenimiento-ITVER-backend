// ============================================================
// PostgreSQL connection pool configuration
// Uses pg library with environment variables
// ============================================================

import { Pool, PoolClient, types } from 'pg';

// PostgreSQL DATE is a calendar day, not an instant in a time zone.
types.setTypeParser(1082, (value: string) => value);

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'sgm_itver',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'yourpassword',
};

export const pool = new Pool(config);

pool.on('connect', () => {
  console.log(`[DB] Connected to PostgreSQL at ${config.host}:${config.port}/${config.database}`);
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err);
});

// ============================================================
// Service-context client (bypasses RLS)
// Used ONLY for authentication operations (login/register)
// where a user session does not exist yet.
// ============================================================

export async function withServiceClient<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Service context: bypass RLS for auth operations.
    // NEVER use this helper for ticket/document operations.
    await client.query("SET LOCAL app.bypass_rls = 'true'");
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
