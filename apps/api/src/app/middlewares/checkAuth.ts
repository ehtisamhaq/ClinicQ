import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { verifyAccessToken } from "../utils/jwt";

export type UserRole = "PATIENT" | "DOCTOR" | "RECEPTIONIST" | "ADMIN";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        clinicId: string;
      };
    }
  }
}

/**
 * Verifies the Bearer JWT and optionally checks that the user has one of
 * the required roles. Sets req.user = { id, role, clinicId }.
 */
export function checkAuth(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return next(new AppError(401, "Authentication required"));
    }

    const token = authHeader.slice(7);
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return next(new AppError(401, "Invalid or expired token"));
    }

    if (payload.type !== "access") {
      return next(new AppError(401, "Invalid token type"));
    }

    if (roles.length > 0 && !roles.includes(payload.role as UserRole)) {
      return next(new AppError(403, "You do not have permission to perform this action"));
    }

    req.user = {
      id: payload.sub,
      role: payload.role as UserRole,
      clinicId: payload.clinicId,
    };

    next();
  };
}
