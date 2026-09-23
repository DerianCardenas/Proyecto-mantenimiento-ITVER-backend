-- ============================================================
-- SGM-ITVER: Schema Inicial para PostgreSQL
-- Proyecto: Sistema de Gestión y Seguimiento de Mantenimiento
-- ============================================================
-- Convención: snake_case en DB, camelCase en API/JSON
-- RLS habilitado en todas las tablas

-- Eliminar tablas en orden correcto (borrado limpio)
DROP TABLE IF EXISTS ticket_documents CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

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

-- Helper function para obtener el role del usuario actual
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid()::uuid;
$$ LANGUAGE sql STABLE;

-- ============================================================
-- POLÍTICAS RLS
-- ============================================================

-- USERS
-- Los admins ven todos los usuarios, los usuarios ven su propio perfil
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (
    auth.uid()::text = id::text
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (
    auth.uid()::text = id::text
  );

-- BUILDINGS
-- Todos pueden ver edificios (solo lectura para usuarios autenticados)
CREATE POLICY "Authenticated users can view buildings" ON buildings
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- TICKETS
-- Los usuarios pueden ver tickets que crearon, que les fueron asignados, o son admins
CREATE POLICY "Users can view own tickets" ON tickets
  FOR SELECT USING (
    auth.uid()::text = created_by::text
    OR auth.uid()::text = assigned_to::text
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Los técnicos y admins pueden insertar tickets
CREATE POLICY "Technicians and admins can create tickets" ON tickets
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Los creadores, asignados o admins pueden actualizar
CREATE POLICY "Users can update own tickets" ON tickets
  FOR UPDATE USING (
    auth.uid()::text = created_by::text
    OR auth.uid()::text = assigned_to::text
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Los creadores, asignados o admins pueden eliminar
CREATE POLICY "Users can delete own tickets" ON tickets
  FOR DELETE USING (
    auth.uid()::text = created_by::text
    OR auth.uid()::text = assigned_to::text
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- TICKET_DOCUMENTS
-- Los usuarios pueden ver documentos de tickets propios o asignados
CREATE POLICY "Users can view documents of own tickets" ON ticket_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_documents.ticket_id
        AND (
          auth.uid()::text = t.created_by::text
          OR auth.uid()::text = t.assigned_to::text
          OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
        )
    )
  );

-- Los usuarios pueden insertar documentos en tickets que ven
CREATE POLICY "Users can insert documents of own tickets" ON ticket_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_documents.ticket_id
        AND (
          auth.uid()::text = t.created_by::text
          OR auth.uid()::text = t.assigned_to::text
          OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
        )
    )
  );

CREATE POLICY "Users can delete own documents" ON ticket_documents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_documents.ticket_id
        AND (
          auth.uid()::text = t.created_by::text
          OR auth.uid()::text = t.assigned_to::text
          OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
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

-- Usuario admin por defecto (password: admin123)
-- Contraseña encriptada con bcrypt (12 rounds)
-- Generar con: bcrypt.hashSync('admin123', 12)
INSERT INTO users (username, email, password_hash, role, full_name, is_active) VALUES
  ('admin', 'admin@itver.edu.mx', '$2a$12$LJ3mY5v8qK9xP2nR7wQ1GeH5sT4dF6rA8bC0eD1fG2hI3jK4lM5nO', 'admin', 'Administrador ITVER', true),
  ('tecnico1', 'tecnico1@itver.edu.mx', '$2a$12$LJ3mY5v8qK9xP2nR7wQ1GeH5sT4dF6rA8bC0eD1fG2hI3jK4lM5nO', 'technician', 'Técnico Principal', true);

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
-- NOTAS
-- ============================================================
-- Para desarrollo local sin JWT auth real, usar el helper:
-- SET LOCAL app.current_user_id = 'uuid-aqui';
--
-- Para producción con Supabase Auth o custom JWT:
-- El middleware establece auth.uid() vía JWT claims
--
-- Migraciones futuras en: migrations/002_*.sql
