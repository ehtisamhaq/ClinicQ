"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { apiClient } from "@/lib/api/client";
import { isApiError } from "@/lib/api/types";
import { CACHE_TAGS } from "@/lib/api/cache-tags";
import {
  updateDoctorProfileSchema,
  updateDoctorScheduleInputSchema,
  createKnowledgeSchema,
  updateKnowledgeSchema,
  type UpdateDoctorProfileInput,
  type UpdateDoctorScheduleInput,
  type CreateKnowledgeInput,
  type UpdateKnowledgeInput,
} from "./validation";

export interface AdminActionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: unknown;
}

/**
 * Update doctor profile (specialty, consultation fee, avg consult minutes, bio)
 */
export async function updateDoctorProfileAction(
  input: UpdateDoctorProfileInput
): Promise<AdminActionResult> {
  const parsed = updateDoctorProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid doctor profile data",
    };
  }

  const { doctorId, ...data } = parsed.data;

  try {
    const res = await apiClient.put(`/doctors/${doctorId}`, {
      auth: "session",
      body: data,
    });

    revalidateTag(CACHE_TAGS.DOCTORS, "max");
    revalidateTag(CACHE_TAGS.SPECIALTIES, "max");
    revalidateTag(CACHE_TAGS.doctor(doctorId), "max");
    revalidatePath("/doctors");
    revalidatePath("/book");

    return {
      success: true,
      message: "Doctor profile updated successfully.",
      data: res.data,
    };
  } catch (err) {
    if (isApiError(err)) return { success: false, error: err.message };
    return { success: false, error: "Failed to update doctor profile." };
  }
}

/**
 * Update doctor weekly consultation schedule
 */
export async function updateDoctorScheduleAction(
  input: UpdateDoctorScheduleInput
): Promise<AdminActionResult> {
  const parsed = updateDoctorScheduleInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid schedule data",
    };
  }

  const { doctorId, schedules } = parsed.data;

  try {
    const res = await apiClient.put(`/doctors/${doctorId}/schedules`, {
      auth: "session",
      body: { schedules },
    });

    revalidateTag(CACHE_TAGS.DOCTORS, "max");
    revalidateTag(CACHE_TAGS.doctorSchedule(doctorId), "max");
    revalidatePath("/schedules");
    revalidatePath("/book");

    return {
      success: true,
      message: "Doctor weekly schedules updated successfully.",
      data: res.data,
    };
  } catch (err) {
    if (isApiError(err)) return { success: false, error: err.message };
    return { success: false, error: "Failed to update schedules." };
  }
}

/**
 * Create a new RAG clinic knowledge base document
 */
export async function createKnowledgeDocAction(
  input: CreateKnowledgeInput
): Promise<AdminActionResult> {
  const parsed = createKnowledgeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid knowledge document data",
    };
  }

  try {
    const res = await apiClient.post("/knowledge", parsed.data, {
      auth: "session",
    });

    revalidateTag(CACHE_TAGS.KNOWLEDGE, "max");
    revalidatePath("/knowledge");

    return {
      success: true,
      message: "Knowledge document added to clinic knowledge base.",
      data: res.data,
    };
  } catch (err) {
    if (isApiError(err)) return { success: false, error: err.message };
    return { success: false, error: "Failed to create knowledge document." };
  }
}

/**
 * Update an existing RAG clinic knowledge base document
 */
export async function updateKnowledgeDocAction(
  input: UpdateKnowledgeInput
): Promise<AdminActionResult> {
  const parsed = updateKnowledgeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid document data",
    };
  }

  const { id, ...data } = parsed.data;

  try {
    const res = await apiClient.put(`/knowledge/${id}`, {
      auth: "session",
      body: data,
    });

    revalidateTag(CACHE_TAGS.KNOWLEDGE, "max");
    revalidatePath("/knowledge");

    return {
      success: true,
      message: "Knowledge document updated.",
      data: res.data,
    };
  } catch (err) {
    if (isApiError(err)) return { success: false, error: err.message };
    return { success: false, error: "Failed to update knowledge document." };
  }
}

/**
 * Delete a RAG clinic knowledge base document
 */
export async function deleteKnowledgeDocAction(
  id: string
): Promise<AdminActionResult> {
  if (!id) return { success: false, error: "Document ID is required" };

  try {
    await apiClient.delete(`/knowledge/${id}`, {
      auth: "session",
    });

    revalidateTag(CACHE_TAGS.KNOWLEDGE, "max");
    revalidatePath("/knowledge");

    return {
      success: true,
      message: "Knowledge document removed.",
    };
  } catch (err) {
    if (isApiError(err)) return { success: false, error: err.message };
    return { success: false, error: "Failed to delete knowledge document." };
  }
}
