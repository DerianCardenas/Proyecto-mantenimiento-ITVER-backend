-- Reference SQL for the post-bootstrap state created by src/scripts/migrate.ts.
-- Do not execute this file as a replacement for the runner: the runner owns
-- advisory locking, preflight checks, ordered migration execution and secrets.

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(32) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Expected migration ledger after a successful bootstrap:
SELECT version, filename, applied_at
FROM schema_migrations
ORDER BY version;

-- The application role must be restricted so PostgreSQL RLS remains effective.
SELECT rolname, rolsuper, rolcreatedb, rolcreaterole, rolbypassrls
FROM pg_roles
WHERE rolname = 'sgm_app';

-- Expected domain tables:
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'buildings', 'tickets', 'ticket_documents')
ORDER BY table_name;
