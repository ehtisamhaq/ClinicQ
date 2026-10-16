import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny } from "zod";

type ValidateTargets = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

/**
 * Validates req.body, req.query, and/or req.params against Zod schemas.
 * Throws ZodError on failure which the globalErrorHandler converts to 400.
 */
export function validateRequest(schemas: ValidateTargets) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as typeof req.query;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
