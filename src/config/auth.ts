// ============================================================
// JWT utilities for authentication
// ============================================================

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '86400'; // 24h

export function generateToken(payload: { id: string; role: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as string,
  });
}

export function verifyToken(token: string): { id: string; role: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; role: string; email: string };
  } catch {
    return null;
  }
}

export interface JwtPayload {
  id: string;
  role: string;
  email: string;
}

export { JWT_SECRET, JWT_EXPIRES_IN };
