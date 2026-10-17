import { apiClient } from "@/lib/api/client";
import { isUnauthorized, isForbidden } from "@/lib/api/types";
import type {
  AdminDashboardMetrics,
  KnowledgeDocument,
  DoctorScheduleItem,
} from "./types";
import { type DoctorCatalogItem, formatDoctorCatalogItem } from "@/lib/catalog/queries";

/**
 * Fetch operational dashboard metrics for clinic administrators
 * Dynamic (no-store): Must never be shared or cached across users
 */
export async function getAdminDashboardMetrics(
  from?: string,
  to?: string
): Promise<AdminDashboardMetrics | null> {
  try {
    const res = await apiClient.get<AdminDashboardMetrics>("/admin/metrics", {
      auth: "session",
      query: { from, to },
    });
    return res.data || null;
  } catch (err) {
    if (!isUnauthorized(err) && !isForbidden(err)) {
      console.error("Failed to load admin metrics:", err);
    }
    return null;
  }
}

/**
 * Fetch all doctors in the clinic for administration
 */
export async function getAdminDoctors(): Promise<DoctorCatalogItem[]> {
  try {
    const res = await apiClient.get<any[]>("/doctors", {
      auth: "session",
      query: { limit: 100 },
    });
    return (res.data || []).map(formatDoctorCatalogItem);
  } catch (err) {
    if (!isUnauthorized(err) && !isForbidden(err)) {
      console.error("Failed to load clinic doctors:", err);
    }
    return [];
  }
}

/**
 * Fetch doctor schedules for the schedule manager
 */
export async function getAdminDoctorSchedules(
  doctorId: string
): Promise<DoctorScheduleItem[]> {
  try {
    const res = await apiClient.get<DoctorScheduleItem[]>(
      `/doctors/${doctorId}/schedules`,
      {
        auth: "session",
      }
    );
    return res.data || [];
  } catch (err) {
    if (!isUnauthorized(err) && !isForbidden(err)) {
      console.error(`Failed to load schedules for doctor ${doctorId}:`, err);
    }
    return [];
  }
}

/**
 * Fetch clinic knowledge base documents
 */
export async function getKnowledgeDocs(
  params?: { category?: string; search?: string }
): Promise<KnowledgeDocument[]> {
  try {
    const res = await apiClient.get<KnowledgeDocument[]>("/knowledge", {
      auth: "session",
      query: {
        category: params?.category,
        search: params?.search,
        limit: 50,
      },
    });
    return res.data || [];
  } catch (err) {
    if (!isUnauthorized(err) && !isForbidden(err)) {
      console.error("Failed to load knowledge documents:", err);
    }
    return [];
  }
}
