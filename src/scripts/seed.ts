import 'dotenv/config';
import bcrypt from 'bcrypt';
import { pool, withServiceClient } from '../config/database';

const SALT_ROUNDS = 12;

type SeedUser = {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'technician';
  fullName: string;
};

function seedUsers(): SeedUser[] {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD?.trim();
  if (!adminPassword && process.env.NODE_ENV === 'production') {
    throw new Error('[SEED] SEED_ADMIN_PASSWORD is required in production');
  }

  const users: SeedUser[] = [{
    username: process.env.SEED_ADMIN_USERNAME?.trim() || 'admin',
    email: process.env.SEED_ADMIN_EMAIL?.trim() || 'admin@itver.edu.mx',
    password: adminPassword || 'admin123',
    role: 'admin',
    fullName: process.env.SEED_ADMIN_FULL_NAME?.trim() || 'Administrador ITVER',
  }];

  const technicianPassword = process.env.SEED_TECH_PASSWORD?.trim();
  if (technicianPassword) {
    users.push({
      username: process.env.SEED_TECH_USERNAME?.trim() || 'tecnico1',
      email: process.env.SEED_TECH_EMAIL?.trim() || 'tecnico1@itver.edu.mx',
      password: technicianPassword,
      role: 'technician',
      fullName: process.env.SEED_TECH_FULL_NAME?.trim() || 'Técnico Principal',
    });
  }

  return users;
}

async function seed(): Promise<void> {
  const users = seedUsers();

  await withServiceClient(async (client) => {
    for (const user of users) {
      const existing = await client.query(
        'SELECT 1 FROM users WHERE username = $1 OR email = $2',
        [user.username, user.email]
      );
      if (existing.rowCount) {
        console.log(`[SEED] ${user.username} already exists`);
        continue;
      }

      const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);
      await client.query(
        `INSERT INTO users (
           username, email, password_hash, role, full_name,
           is_active, must_change_password, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, true, true, NOW(), NOW())`,
        [user.username, user.email, passwordHash, user.role, user.fullName]
      );
      console.log(`[SEED] Created ${user.role} user ${user.username}`);
    }
  });
}

seed()
  .then(() => console.log('[SEED] Database seed is ready'))
  .catch((error: unknown) => {
    console.error('[SEED] Failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => undefined);
  });
