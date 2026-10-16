const IS_SERVER = typeof window === "undefined";

/**
 * Centralized API Base URL for ClinicQ
 * Automatically resolves between server-side execution (internal network or API_URL)
 * and browser execution (NEXT_PUBLIC_API_URL or fallback).
 */
export function getApiBaseUrl(): string {
  if (IS_SERVER) {
    return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
}

/**
 * Helper to construct a fully qualified API endpoint URL from path
 */
export function getApiUrl(path: string = ""): string {
  const base = getApiBaseUrl().replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

/**
 * Centralized Socket.IO server URL
 */
export function getSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  const api = getApiBaseUrl();
  return api.replace(/\/api(\/v1)?\/?$/, "") || "http://localhost:4000";
}
