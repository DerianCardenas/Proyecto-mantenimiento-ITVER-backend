// ============================================================
// Auth Service - User registration, login, and management
// Uses bcrypt for password hashing, JWT for tokens
// DB columns are snake_case; transforms to camelCase via snakeToCamel
// ============================================================

import bcrypt from 'bcrypt';
import { pool } from '../../config/database';
import { generateToken } from '../../config/auth';
import { snakeToCamel } from '../../utils/snakeCase';
import { UserResponse } from '../../types';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: string;
}): Promise<UserResponse> {
  const hashedPassword = await hashPassword(data.password);

  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash, role, full_name, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
     RETURNING *`,
    [data.username, data.email, hashedPassword, data.role, data.fullName]
  );

  const row = snakeToCamel(result.rows[0]) as Record<string, unknown>;
  // Remove password_hash from response
  const { passwordHash: _passwordHash, ...userResponse } = row;

  return {
    id: userResponse.id as string,
    username: userResponse.username as string,
    email: userResponse.email as string,
    role: userResponse.role as string,
    fullName: userResponse.fullName as string,
    isActive: userResponse.isActive as boolean,
    createdAt: userResponse.createdAt as string,
  } as UserResponse;
}

export async function loginUser(email: string, password: string): Promise<{ token: string; user: UserResponse }> {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

  if (result.rowCount === 0) {
    throw new Error('Credenciales inválidas');
  }

  const row = snakeToCamel(result.rows[0]) as Record<string, unknown>;
  const passwordHash = row.passwordHash as string;

  const isValid = await comparePassword(password, passwordHash);
  if (!isValid) {
    throw new Error('Credenciales inválidas');
  }

  const token = generateToken({
    id: row.id as string,
    role: row.role as string,
    email: row.email as string,
  });

  const { passwordHash: _pw, ...userWithoutPassword } = row;

  const user = {
    id: userWithoutPassword.id as string,
    username: userWithoutPassword.username as string,
    email: userWithoutPassword.email as string,
    role: userWithoutPassword.role as string,
    fullName: userWithoutPassword.fullName as string,
    isActive: userWithoutPassword.isActive as boolean,
    createdAt: userWithoutPassword.createdAt as string,
  } as UserResponse;

  return { token, user };
}

export async function getUserById(id: string): Promise<UserResponse | null> {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

  if (result.rowCount === 0) {
    return null;
  }

  const row = snakeToCamel(result.rows[0]) as Record<string, unknown>;
  const { passwordHash: _pw, ...userWithoutPassword } = row;

  return {
    id: userWithoutPassword.id as string,
    username: userWithoutPassword.username as string,
    email: userWithoutPassword.email as string,
    role: userWithoutPassword.role as string,
    fullName: userWithoutPassword.fullName as string,
    isActive: userWithoutPassword.isActive as boolean,
    createdAt: userWithoutPassword.createdAt as string,
  } as UserResponse;
}

export async function listUsers(): Promise<UserResponse[]> {
  const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');

  return result.rows.map((row) => {
    const camel = snakeToCamel(row) as Record<string, unknown>;
    const { passwordHash: _pw, ...userWithoutPassword } = camel;
    return {
      id: userWithoutPassword.id as string,
      username: userWithoutPassword.username as string,
      email: userWithoutPassword.email as string,
      role: userWithoutPassword.role as string,
      fullName: userWithoutPassword.fullName as string,
      isActive: userWithoutPassword.isActive as boolean,
      createdAt: userWithoutPassword.createdAt as string,
    } as UserResponse;
  });
}

export async function updateUser(id: string, data: { fullName?: string; role?: string }): Promise<UserResponse | null> {
  const existing = await getUserById(id);
  if (!existing) return null;

  const fullName = data.fullName ?? existing.fullName;
  const role = data.role ?? existing.role;

  const result = await pool.query(
    `UPDATE users SET full_name = $1, role = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
    [fullName, role, id]
  );

  const row = snakeToCamel(result.rows[0]) as Record<string, unknown>;
  const { passwordHash: _pw, ...userWithoutPassword } = row;

  return {
    id: userWithoutPassword.id as string,
    username: userWithoutPassword.username as string,
    email: userWithoutPassword.email as string,
    role: userWithoutPassword.role as string,
    fullName: userWithoutPassword.fullName as string,
    isActive: userWithoutPassword.isActive as boolean,
    createdAt: userWithoutPassword.createdAt as string,
  } as UserResponse;
}
