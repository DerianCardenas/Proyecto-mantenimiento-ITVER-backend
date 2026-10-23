-- Snapshot query for the Railway database before spec 001.
-- Observed on 2026-10-22: no domain tables and no schema migrations.
-- This file is intentionally read-only; there is no production data to roll back.

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

SELECT rolname, rolsuper, rolbypassrls
FROM pg_roles
WHERE rolname = 'sgm_app';

SELECT to_regclass('public.schema_migrations') AS migration_ledger;
