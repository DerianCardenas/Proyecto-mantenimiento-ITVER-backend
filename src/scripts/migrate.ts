import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client, ClientConfig } from 'pg';

const MIGRATIONS = [
  { version: '001', file: '001_initial_schema.sql' },
  { version: '002', file: '002_force_rls.sql' },
  { version: '003', file: '003_technician_password_policy.sql' },
] as const;

const DOMAIN_TABLES = ['users', 'buildings', 'tickets', 'ticket_documents'];
const LOCK_ID = 8241001;

function adminConfig(): ClientConfig {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (connectionString) return { connectionString, application_name: 'sgm-itver-migrations' };

  if (process.env.NODE_ENV === 'production') {
    throw new Error('[MIGRATION] DATABASE_URL is required in production');
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number.parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'sgm_itver',
    user: process.env.DB_MIGRATION_USER || 'postgres',
    password: process.env.DB_MIGRATION_PASSWORD || process.env.DB_PASSWORD || 'yourpassword',
    application_name: 'sgm-itver-migrations',
  };
}

function applicationCredentials(): { role: string; password: string } {
  const role = process.env.DB_USER?.trim() || 'sgm_app';
  const password = process.env.DB_PASSWORD?.trim() || '';

  if (!/^[a-z_][a-z0-9_]*$/i.test(role)) {
    throw new Error('[MIGRATION] DB_USER contains unsupported characters');
  }
  if (['postgres', 'root'].includes(role.toLowerCase())) {
    throw new Error('[MIGRATION] DB_USER must be a restricted application role');
  }
  if (!password || ['yourpassword', 'your_app_password'].includes(password)) {
    throw new Error('[MIGRATION] DB_PASSWORD must be a real application-role secret');
  }

  return { role, password };
}

function migrationSql(file: string): string {
  return readFileSync(resolve(__dirname, '../../migrations', file), 'utf8');
}

async function ensureLedger(client: Client): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(32) PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function verifySafeBaseline(client: Client): Promise<void> {
  const ledger = await client.query<{ count: number }>(
    'SELECT COUNT(*)::int AS count FROM schema_migrations'
  );
  if ((ledger.rows[0]?.count ?? 0) > 0) return;

  const existing = await client.query<{ table_name: string }>(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])
      ORDER BY table_name`,
    [DOMAIN_TABLES]
  );

  if (existing.rowCount) {
    throw new Error(
      `[MIGRATION] Existing domain tables found without migration history: ${existing.rows
        .map((row) => row.table_name)
        .join(', ')}. Refusing to run destructive bootstrap.`
    );
  }
}

async function applyPendingMigrations(client: Client): Promise<void> {
  const appliedResult = await client.query<{ version: string }>('SELECT version FROM schema_migrations');
  const applied = new Set(appliedResult.rows.map((row) => row.version));

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.version)) {
      console.log(`[MIGRATION] ${migration.version} already applied`);
      continue;
    }

    console.log(`[MIGRATION] Applying ${migration.file}`);
    await client.query('BEGIN');
    try {
      await client.query(migrationSql(migration.file));
      await client.query(
        'INSERT INTO schema_migrations (version, filename) VALUES ($1, $2)',
        [migration.version, migration.file]
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    }
  }
}

async function provisionApplicationRole(client: Client): Promise<void> {
  const { role, password } = applicationCredentials();
  await client.query("SELECT set_config('app.bootstrap_role', $1, false)", [role]);
  await client.query("SELECT set_config('app.bootstrap_password', $1, false)", [password]);

  await client.query(`
    DO $$
    DECLARE
      target_role TEXT := current_setting('app.bootstrap_role');
      target_password TEXT := current_setting('app.bootstrap_password');
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = target_role) THEN
        EXECUTE format(
          'CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS',
          target_role,
          target_password
        );
      ELSE
        EXECUTE format(
          'ALTER ROLE %I WITH LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS',
          target_role,
          target_password
        );
      END IF;

      EXECUTE format('GRANT CONNECT ON DATABASE %I TO %I', current_database(), target_role);
      EXECUTE format('GRANT USAGE ON SCHEMA public TO %I', target_role);
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO %I', target_role);
      EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO %I', target_role);
      EXECUTE format('GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO %I', target_role);
      EXECUTE format('REVOKE ALL ON TABLE schema_migrations FROM %I', target_role);
      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I',
        target_role
      );
      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO %I',
        target_role
      );
      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO %I',
        target_role
      );
    END
    $$
  `);

  console.log(`[MIGRATION] Application role ${role} is ready`);
}

async function main(): Promise<void> {
  const client = new Client(adminConfig());
  await client.connect();

  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_ID]);
    await ensureLedger(client);
    await verifySafeBaseline(client);
    await applyPendingMigrations(client);
    await provisionApplicationRole(client);
    console.log('[MIGRATION] Database is ready');
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_ID]).catch(() => undefined);
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error('[MIGRATION] Failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
