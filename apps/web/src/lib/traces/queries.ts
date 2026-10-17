import "server-only";
import { apiClient } from "@/lib/api/client";
import { isUnauthorized, isForbidden } from "@/lib/api/types";
import type { AssistantTrace, TracesFilterOptions, TracesResponse } from "./types";

export async function getAssistantTraces(
  options: TracesFilterOptions = {}
): Promise<TracesResponse> {
  const { page = 1, limit = 20, outcome, patientId } = options;

  try {
    const res = await apiClient.get<AssistantTrace[]>("/assistant/traces", {
      auth: "session",
      query: {
        page,
        limit,
        outcome: outcome && outcome !== "ALL" ? outcome : undefined,
        patientId: patientId || undefined,
      },
      next: { revalidate: 0 },
    });

    const total = Number(res.meta?.total ?? res.data.length);
    const totalPages = Number(res.meta?.totalPages ?? Math.max(1, Math.ceil(total / limit)));

    return {
      data: res.data || [],
      meta: {
        page: Number(res.meta?.page ?? page),
        limit: Number(res.meta?.limit ?? limit),
        total,
        totalPages,
      },
    };
  } catch (err) {
    if (!isUnauthorized(err) && !isForbidden(err)) {
      console.error("Failed to load assistant traces:", err);
    }
    return {
      data: [],
      meta: { page, limit, total: 0, totalPages: 0 },
    };
  }
}

export async function getAssistantTraceById(id: string): Promise<AssistantTrace | null> {
  if (!id) return null;

  try {
    const res = await apiClient.get<AssistantTrace>(`/assistant/traces/${id}`, {
      auth: "session",
      next: { revalidate: 0 },
    });
    return res.data || null;
  } catch (err) {
    if (!isUnauthorized(err) && !isForbidden(err)) {
      console.error(`Failed to load assistant trace ${id}:`, err);
    }
    return null;
  }
}
