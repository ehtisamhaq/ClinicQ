import type { Response } from "express";

interface SendResponseOptions<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: unknown;
  };
}

/**
 * Sends a consistent JSON response envelope for all success responses.
 * Shape: { success, message, data?, meta? }
 */
export function sendResponse<T>(res: Response, options: SendResponseOptions<T>): void {
  const { statusCode, success, message, data, meta } = options;
  const body: Record<string, unknown> = { success, message };
  if (data !== undefined) body.data = data;
  if (meta !== undefined) body.meta = meta;
  res.status(statusCode).json(body);
}
