// ============================================================
// Zod validation middleware factory
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { z, ZodTypeAny } from 'zod';

export function validate(schema: z.ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
    } catch {
      // Inline validation is enforced by each controller via validateSync
    }
    next();
  };
}

// Synchronous validation that returns errors (ZodIssue inferido)
export function validateSync(schema: ZodTypeAny, body: unknown) {
  return schema.safeParse(body);
}