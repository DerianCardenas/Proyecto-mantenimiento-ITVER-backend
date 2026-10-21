import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: Number.parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'sgm_itver',
  user: process.env.DB_MIGRATION_USER || process.env.DB_USER || 'postgres',
  password: process.env.DB_MIGRATION_PASSWORD || process.env.DB_PASSWORD || 'yourpassword',
});

async function main() {
  const migration = readFileSync(resolve(__dirname, '../migrations/003_technician_password_policy.sql'), 'utf8');
  await client.connect();
  await client.query(migration);
  console.log('[MIGRATION] Technician password policy applied');
}

main()
  .catch((error) => {
    if (error?.code === '42501') {
      console.error('[MIGRATION] Use DB_MIGRATION_USER and DB_MIGRATION_PASSWORD for the table owner or a PostgreSQL administrator.');
    } else {
      console.error('[MIGRATION] Failed:', error);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end().catch(() => undefined);
  });
