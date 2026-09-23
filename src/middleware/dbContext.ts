// ============================================================
// dbContext Middleware - RLS session context per request
//
// Acquires a dedicated client from the pool, wraps the request
// in a transaction, and sets the RLS session variables:
//   app.current_user_id  -> req.user.id
//   app.current_user_role -> req.user.role
//
// All queries in controllers/services during this request MUST
// use req.dbClient so they inherit the RLS context.
// The transaction is rolled back/committed on response finish.
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';

const NULL_ID = '00000000-0000-0000-0000-000000000000';

export async function dbContext(req: Request, res: Response, next: NextFunction) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const user = (req as any).user as { id?: string; role?: string } | undefined;
    const userId = user?.id || NULL_ID;
    const userRole = user?.role || 'guest';

    // Set RLS context for this transaction
    // NOTE: SET LOCAL does NOT accept bind parameters ($1) in PostgreSQL,
    // so we use set_config(name, value, is_local), which is equivalent
    // and supports parameterized values safely.
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [userId]);
    await client.query("SELECT set_config('app.current_user_role', $1, true)", [userRole]);

    // Attach the client so services can use it (RLS-aware)
    (req as any).dbClient = client;
    (res as any).dbClient = client;

    let finished = false;
    const finish = async (commit: boolean) => {
      if (finished) return;
      finished = true;
      try {
        await client.query(commit ? 'COMMIT' : 'ROLLBACK');
      } finally {
        client.release();
      }
    };

    res.on('finish', () => {
      void finish(res.statusCode < 500);
    });
    res.on('close', () => {
      void finish(false);
    });

    next();
  } catch (err) {
    client.release();
    next(err);
  }
}

// Helper for services: returns the request-scoped client or falls back to pool
export function getDb(req: Request) {
  return (req as any).dbClient || pool;
}