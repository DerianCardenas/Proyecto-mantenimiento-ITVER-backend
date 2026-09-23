-- ============================================================
-- 002_force_rls.sql
-- Aplica FORCE ROW LEVEL SECURITY a todas las tablas.
--
-- MOTIVO: el backend se conecta como 'postgres' (dueño de las
-- tablas). En PostgreSQL, el dueño/owner OMITE RLS por defecto,
-- por lo que las políticas nunca se aplicaban. FORCE hace que
-- RLS aplique también al dueño.
--
-- Requisitos previos: migración 001 aplicada.
-- El backend ya establece el contexto por request (dbContext)
-- y usa app.bypass_rls = 'true' solo para auth (withServiceClient).
-- ============================================================

-- Policy INSERT para edificios (antes no existía):
-- el servicio (bypass) y los admins pueden crear edificios.
CREATE POLICY "Admin or service can insert buildings" ON buildings
  FOR INSERT WITH CHECK (
    current_setting('app.bypass_rls', true) = 'true'
    OR is_admin()
  );

-- Policy UPDATE para edificios (administración).
CREATE POLICY "Admin or service can update buildings" ON buildings
  FOR UPDATE USING (
    current_setting('app.bypass_rls', true) = 'true'
    OR is_admin()
  );

-- FORCE ROW LEVEL SECURITY: RLS aplica a TODOS los roles,
-- incluido el dueño (postgres), que es con quien se conecta la app.
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE buildings FORCE ROW LEVEL SECURITY;
ALTER TABLE tickets FORCE ROW LEVEL SECURITY;
ALTER TABLE ticket_documents FORCE ROW LEVEL SECURITY;