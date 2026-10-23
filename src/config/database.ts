// ============================================================
// PostgreSQL connection pool configuration
// Uses pg library with environment variables
// ============================================================

import { Pool, PoolClient, types } from 'pg';

// PostgreSQL DATE is a calendar day, not an instant in a time zone.
types.setTypeParser(1082, (value: string) => value);

const isProduction = process.env.NODE_ENV === 'production';

function env(name: string, developmentFallback: string): string {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (isProduction) throw new Error(`[CONFIG] ${name} is required in production`);
  return developmentFallback;
}

const config = {
  host: env('DB_HOST', 'localhost'),
  port: parseInt(env('DB_PORT', '5432'), 10),
  database: env('DB_NAME', 'sgm_itver'),
  user: env('DB_USER', 'postgres'),
  password: env('DB_PASSWORD', 'yourpassword'),
  application_name: 'sgm-itver-backend',
};

if (!Number.isInteger(config.port) || config.port <= 0) {
  throw new Error('[CONFIG] DB_PORT must be a valid positive integer');
}

if (isProduction && ['postgres', 'root'].includes(config.user.toLowerCase())) {
  throw new Error('[CONFIG] DB_USER must be a restricted application role in production');
}

if (isProduction && ['yourpassword', 'your_app_password'].includes(config.password)) {
  throw new Error('[CONFIG] DB_PASSWORD must not use an example value in production');
}

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
