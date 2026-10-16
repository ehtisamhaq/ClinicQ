import { z } from "zod";

export interface ApiMeta {
  total?: number;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface ApiEnvelope<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: ApiMeta;
  issues?: Record<string, string[]>;
  stack?: string;
}

export interface ApiResult<T> {
  data: T;
  meta?: ApiMeta;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly issues?: Record<string, string[]>;

  constructor(options: {
    status: number;
    message: string;
    code?: string;
    issues?: Record<string, string[]>;
  }) {
    super(options.message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.issues = options.issues;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

export function isUnauthorized(err: unknown): boolean {
  return isApiError(err) && err.status === 401;
}

export function isForbidden(err: unknown): boolean {
  return isApiError(err) && err.status === 403;
}

export function isNotFound(err: unknown): boolean {
  return isApiError(err) && err.status === 404;
}

export function isConflict(err: unknown): boolean {
  return isApiError(err) && err.status === 409;
}

export interface RequestOptions<T = unknown> {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  schema?: z.ZodType<T>;
  auth?: "session" | "none";
  timeoutMs?: number;
  retries?: number;
  idempotencyKey?: string;
  cache?: RequestCache;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
  signal?: AbortSignal;
  headers?: HeadersInit;
}

// User role definition matching the backend Prisma Role enum
export type UserRole = "PATIENT" | "RECEPTIONIST" | "DOCTOR" | "ADMIN";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clinicId: string;
  phone?: string | null;
  preferredLanguage?: string | null;
}
