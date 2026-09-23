// ============================================================
// Express Request augmentation
// Adds typed `req.user` (JWT payload) and `req.dbClient` (RLS client)
// ============================================================

import 'express';
import { PoolClient } from 'pg';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        email: string;
      };
      dbClient?: PoolClient;
      file?: Express.Multer.File;
    }
  }
}

export {};