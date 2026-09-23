// ============================================================
// PostgreSQL connection pool configuration
// Uses pg library with environment variables
// ============================================================

import { Pool } from 'pg';

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

export default pool;
