// ============================================================
// JWT utilities for authentication
// ============================================================

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET?.trim() || 'change-me-dev-secret';
const JWT_EXPIRES_IN_RAW = process.env.JWT_EXPIRES_IN || '86400'; // 24h in seconds

if (process.env.NODE_ENV === 'production' && (
  JWT_SECRET === 'change-me-dev-secret'
  || JWT_SECRET === 'your-super-secret-key-change-me'
  || JWT_SECRET.length < 32
)) {
  throw new Error('[CONFIG] JWT_SECRET must be a non-example value of at least 32 characters in production');
}

// jsonwebtoken: a NUMBER expiresIn is interpreted as SECONDS;
// a STRING is passed through ms() and interpreted as MILLISECONDS.
// So bare numeric strings (e.g. '86400') must be parsed to numbers.
const JWT_EXPIRES_IN: jwt.SignOptions['expiresIn'] = (/^\d+$/.test(JWT_EXPIRES_IN_RAW)
  ? parseInt(JWT_EXPIRES_IN_RAW, 10)
  : JWT_EXPIRES_IN_RAW) as jwt.SignOptions['expiresIn'];

export function generateToken(payload: { id: string; role: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
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
