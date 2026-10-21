-- ============================================================
-- SGM-ITVER: Schema Inicial para PostgreSQL
-- Proyecto: Sistema de Gestión y Seguimiento de Mantenimiento
-- ============================================================
-- Convención: snake_case en DB, camelCase en API/JSON
-- RLS habilitado en todas las tablas
--
-- IMPORTANTE: RLS usa session variables que el backend establece:
--   SET LOCAL app.current_user_id = '<uuid>'
--   SET LOCAL app.current_user_role = 'admin'|'technician'|'receptionist'
-- El backend lo hace automáticamente en cada request (middleware dbContext).

-- Eliminar tablas en orden correcto (borrado limpio)
DROP TABLE IF EXISTS ticket_documents CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS ticket_status CASCADE;
DROP TYPE IF EXISTS ticket_priority CASCADE;

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'technician', 'receptionist');
CREATE TYPE ticket_status AS ENUM ('pending', 'in_progress', 'resolved', 'closed', 'cancelled');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- ============================================================
-- TABLES
-- ============================================================

-- Usuarios del sistema
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'technician',
    full_name VARCHAR(150) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    must_change_password BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Edificios del ITVER
CREATE TABLE buildings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    location VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets de mantenimiento
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    building_id INTEGER REFERENCES buildings(id),
    building_name VARCHAR(100),
    technician_name VARCHAR(150),
    attention_date DATE,
    recommendations TEXT,
    observations TEXT,
    status ticket_status NOT NULL DEFAULT 'pending',
    priority ticket_priority NOT NULL DEFAULT 'medium',
    created_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documentos adjuntos a tickets (PDFs descargados de SISAD)
CREATE TABLE ticket_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    file_key VARCHAR(500) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES para rendimiento
-- ============================================================

CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_building_id ON tickets(building_id);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_created_by ON tickets(created_by);
CREATE INDEX idx_tickets_attention_date ON tickets(attention_date);
CREATE INDEX idx_ticket_documents_ticket_id ON ticket_documents(ticket_id);
CREATE INDEX idx_ticket_documents_file_key ON ticket_documents(file_key);
CREATE INDEX idx_buildings_name ON buildings(name);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_documents ENABLE ROW LEVEL SECURITY;

-- Helper: ID del usuario actual (leído de app.current_user_id)
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

-- Helper: rol del usuario actual (leído de app.current_user_role)
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
  SELECT NULLIF(current_setting('app.current_user_role', true), '')::user_role;
$$ LANGUAGE sql STABLE;

-- Helper: ¿el usuario actual es admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT current_user_role() = 'admin';
$$ LANGUAGE sql STABLE;

-- ============================================================
-- POLÍTICAS RLS
-- ============================================================

-- USERS
-- SELECT: admins ven todos; usuarios ven su perfil; service context (bypass) para login/register
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (
    current_setting('app.bypass_rls', true) = 'true'
    OR (current_user_id() IS NOT NULL AND (current_user_id()::text = id::text OR is_admin()))
  );

-- INSERT: solo service context (registro vía API) o admin
CREATE POLICY "Only service or admin can insert users" ON users
  FOR INSERT WITH CHECK (
    current_setting('app.bypass_rls', true) = 'true'
    OR is_admin()
  );

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (
    current_user_id() IS NOT NULL
    AND (current_user_id()::text = id::text OR is_admin())
  );

-- BUILDINGS
-- Todos los usuarios autenticados pueden ver edificios
CREATE POLICY "Authenticated users can view buildings" ON buildings
  FOR SELECT USING (
    current_user_id() IS NOT NULL
  );

-- TICKETS
-- Usuarios pueden ver tickets que crearon, que les fueron asignados, o son admins
CREATE POLICY "Users can view own tickets" ON tickets
  FOR SELECT USING (
    current_user_id() IS NOT NULL
    AND (
      current_user_id()::text = created_by::text
      OR current_user_id()::text = assigned_to::text
      OR is_admin()
    )
  );

-- Cualquier usuario autenticado puede crear tickets
CREATE POLICY "Authenticated users can create tickets" ON tickets
  FOR INSERT WITH CHECK (
    current_user_id() IS NOT NULL
  );

-- Creadores, asignados o admins pueden actualizar
CREATE POLICY "Users can update own tickets" ON tickets
  FOR UPDATE USING (
    current_user_id() IS NOT NULL
    AND (
      current_user_id()::text = created_by::text
      OR current_user_id()::text = assigned_to::text
      OR is_admin()
    )
  );

-- Creadores, asignados o admins pueden eliminar
CREATE POLICY "Users can delete own tickets" ON tickets
  FOR DELETE USING (
    current_user_id() IS NOT NULL
    AND (
      current_user_id()::text = created_by::text
      OR current_user_id()::text = assigned_to::text
      OR is_admin()
    )
  );

-- TICKET_DOCUMENTS
-- Usuarios ven documentos de tickets propios o asignados
CREATE POLICY "Users can view documents of own tickets" ON ticket_documents
  FOR SELECT USING (
    current_user_id() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_documents.ticket_id
        AND (
          current_user_id()::text = t.created_by::text
          OR current_user_id()::text = t.assigned_to::text
          OR is_admin()
        )
    )
  );

-- Usuarios pueden subir documentos a tickets que ven
CREATE POLICY "Users can insert documents of own tickets" ON ticket_documents
  FOR INSERT WITH CHECK (
    current_user_id() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_documents.ticket_id
        AND (
          current_user_id()::text = t.created_by::text
          OR current_user_id()::text = t.assigned_to::text
          OR is_admin()
        )
    )
  );

CREATE POLICY "Users can delete own documents" ON ticket_documents
  FOR DELETE USING (
    current_user_id() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_documents.ticket_id
        AND (
          current_user_id()::text = t.created_by::text
          OR current_user_id()::text = t.assigned_to::text
          OR is_admin()
        )
    )
  );

-- ============================================================
-- DATOS SEMILLA (Seed Data)
-- ============================================================

-- Edificios del ITVER
INSERT INTO buildings (name, location) VALUES
  ('Edificio Principal', 'Planta Baja - Centro'),
  ('Edificio de Mantenimiento', 'Interior ITVER'),
  ('Laboratorio de Computo', 'Torre Academica'),
  ('Biblioteca', 'Planta Alta'),
  ('Edificio de Ingenieria', 'Nuevo Edificio'),
  ('Cancha Deportiva', 'Exterior Norte'),
  ('Cafeteria', 'Planta Baja'),
  ('Administracion', 'Entrada Principal');

-- NOTA: El usuario admin se crea con el script de seed del backend:
--   npm run db:seed
-- Este script genera el hash bcrypt correcto (no hardcodear hashes).

-- ============================================================
-- VISTAS para reporting rápido (opcional)
-- ============================================================

CREATE OR REPLACE VIEW v_ticket_summary AS
SELECT
  t.id,
  t.title,
  t.status,
  t.priority,
  t.building_name,
  t.technician_name,
  t.created_at,
  u.full_name AS created_by_name,
  COUNT(td.id) AS document_count
FROM tickets t
LEFT JOIN users u ON t.created_by = u.id
LEFT JOIN ticket_documents td ON td.ticket_id = t.id
GROUP BY t.id, u.full_name;

-- ============================================================
-- NOTAS DE OPERACIÓN
-- ============================================================
-- El backend establece el contexto de seguridad por request:
--   BEGIN;
--   SET LOCAL app.current_user_id = '<uuid>';
--   SET LOCAL app.current_user_role = '<rol>';
--   ...queries...
--   COMMIT;
--
-- Si se necesita bypass temporal (solo desarrollo local):
--   ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
--
-- Migraciones futuras en: migrations/002_*.sql
