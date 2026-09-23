// ============================================================
// Zod validation middleware factory
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      next();
    } catch (err) {
      const messages = (err as any).errors?.map((e: any) => e.message) || ['Validación fallida'];
      req.body = schema.parse({ body: req.body, params: req.params, query: req.query });
      next();
    }
  };
}

// Synchronous validation that returns errors
export function validateSync(schema: ZodSchema, body: unknown) {
  return schema.safeParse(body);
}
