import { ApiError, type ApiEnvelope, type ApiResult, type RequestOptions } from "./types";

import { getApiBaseUrl } from "@/lib/config";
export { getApiBaseUrl };

const IS_SERVER = typeof window === "undefined";

function buildUrl(
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>
): string {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    }
  }

  return url.toString();
}

/**
 * Universal typed request executor
 */
async function request<T>(
  method: string,
  path: string,
  options: RequestOptions<T> = {}
): Promise<ApiResult<T>> {
  const {
    query,
    body,
    schema,
    auth = "session",
    timeoutMs = 15000,
    retries = method === "GET" ? 2 : 0,
    idempotencyKey,
    cache,
    next,
    signal,
    headers: customHeaders = {},
  } = options;

  const url = buildUrl(path, query);
  const headers = new Headers(customHeaders);

  if (body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (idempotencyKey) {
    headers.set("Idempotency-Key", idempotencyKey);
  }

  // Inject authentication on the server if session auth requested
  if (auth === "session" && IS_SERVER) {
    try {
      const { getAccessToken, refreshServerSession } = await import("@/lib/auth/session");
      let token = await getAccessToken();
      if (!token) {
        token = await refreshServerSession();
      }
      if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    } catch {
      // In non-server context or if cookies unavailable, proceed without header
    }
  }

  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutSignal])
    : timeoutSignal;

  let attempt = 0;
  const maxAttempts = 1 + retries;

  while (attempt < maxAttempts) {
    attempt++;

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        cache,
        next,
        signal: combinedSignal,
      });

      // Handle 401 Unauthorized with single token refresh attempt on server
      if (res.status === 401 && auth === "session" && IS_SERVER && attempt === 1) {
        try {
          const { refreshServerSession } = await import("@/lib/auth/session");
          const newToken = await refreshServerSession();
          if (newToken) {
            headers.set("Authorization", `Bearer ${newToken}`);
            // Retry the original request once with new token
            continue;
          }
        } catch {
          // If refresh fails, fall through to error handling
        }
      }

      // If server error (5xx) on idempotent request, retry with exponential backoff
      if (res.status >= 500 && attempt < maxAttempts) {
        const backoffMs = Math.min(100 * Math.pow(2, attempt), 1000);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        continue;
      }

      const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;

      if (!res.ok || !json?.success) {
        throw new ApiError({
          status: res.status,
          message: json?.message || `HTTP error ${res.status}`,
          issues: json?.issues,
        });
      }

      const rawData = json.data as T;
      const parsedData = schema ? schema.parse(rawData) : rawData;

      return {
        data: parsedData,
        meta: json.meta,
        message: json.message,
      };
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw err;
      }

      // Check if network error and should retry
      if (attempt < maxAttempts && method === "GET") {
        const backoffMs = Math.min(100 * Math.pow(2, attempt), 1000);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        continue;
      }

      const isTimeout = combinedSignal.aborted && timeoutSignal.aborted;
      throw new ApiError({
        status: isTimeout ? 408 : 0,
        message: isTimeout
          ? `Request timed out after ${timeoutMs}ms`
          : err instanceof Error
          ? err.message
          : "Network error",
      });
    }
  }

  throw new ApiError({
    status: 500,
    message: "Request failed after maximum retry attempts",
  });
}

/**
 * Universal Typed API Client
 */
export const apiClient = {
  get: <T>(path: string, options?: RequestOptions<T>) =>
    request<T>("GET", path, options),

  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions<T>, "body">) =>
    request<T>("POST", path, { ...options, body }),

  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions<T>, "body">) =>
    request<T>("PUT", path, { ...options, body }),

  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions<T>, "body">) =>
    request<T>("PATCH", path, { ...options, body }),

  delete: <T>(path: string, options?: RequestOptions<T>) =>
    request<T>("DELETE", path, options),
};
export { streamAssistantConversation } from "@/lib/assistant/sse-client";
export type { AssistantStreamEvent } from "@/lib/assistant/sse-client";
