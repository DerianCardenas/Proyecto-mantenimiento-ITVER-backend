// ============================================================
// Seed script - creates initial users with proper bcrypt hashes
// Run with: npm run db:seed
// Requires: database already migrated (001_initial_schema.sql)
// ============================================================

import bcrypt from 'bcrypt';
import { pool } from '../src/config/database';
import dotenv from 'dotenv';

dotenv.config();

const SALT_ROUNDS = 12;

async function seed() {
  const client = await pool.connect();

  try {
    console.log('[SEED] Starting...');

    // Service context bypass for user insertion
    await client.query('BEGIN');
    await client.query("SET LOCAL app.bypass_rls = 'true'");

    const adminHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'admin123', SALT_ROUNDS);
    const techHash = await bcrypt.hash(process.env.SEED_TECH_PASSWORD || 'tecnico123', SALT_ROUNDS);

    const adminExists = await client.query('SELECT 1 FROM users WHERE username = $1', ['admin']);
    if (adminExists.rowCount === 0) {
      await client.query(
        `INSERT INTO users (username, email, password_hash, role, full_name, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, 'admin', $4, true, NOW(), NOW())`,
        ['admin', 'admin@itver.edu.mx', adminHash, 'Administrador ITVER']
      );
      console.log('[SEED] Admin user created (admin / admin123)');
    } else {
      console.log('[SEED] Admin user already exists, skipping');
    }

    const techExists = await client.query('SELECT 1 FROM users WHERE username = $1', ['tecnico1']);
    if (techExists.rowCount === 0) {
      await client.query(
        `INSERT INTO users (username, email, password_hash, role, full_name, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, 'technician', $4, true, NOW(), NOW())`,
        ['tecnico1', 'tecnico1@itver.edu.mx', techHash, 'Técnico Principal']
      );
      console.log('[SEED] Technician user created (tecnico1 / tecnico123)');
    } else {
      console.log('[SEED] Technician user already exists, skipping');
    }

    await client.query('COMMIT');
    console.log('[SEED] Done successfully');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    console.error('[SEED] Error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();