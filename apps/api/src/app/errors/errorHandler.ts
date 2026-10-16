import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "./AppError";
import { env } from "../config/env";
import { sendResponse } from "../utils/sendResponse";

type FieldIssues = Record<string, string[]>;

function mapZodError(err: ZodError): FieldIssues {
  const issues: FieldIssues = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    if (!issues[key]) issues[key] = [];
    issues[key].push(issue.message);
  }
  return issues;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation error
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation error",
      issues: mapZodError(err),
    });
    return;
  }

  // Prisma unique constraint violation
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ success: false, message: "Resource already exists" });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ success: false, message: "Resource not found" });
      return;
    }
  }

  // Operational error (AppError)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Unknown error — log full details, never expose stack in production
  const isDev = env.NODE_ENV === "development";
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(isDev && { stack: err.stack }),
  });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ success: false, message: "Route not found" });
}
