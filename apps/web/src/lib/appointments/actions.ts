"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { apiClient } from "@/lib/api/client";
import { isApiError, isConflict } from "@/lib/api/types";
import { CACHE_TAGS } from "@/lib/api/cache-tags";
import {
  cancelAppointmentSchema,
  rescheduleAppointmentSchema,
} from "./validation";
import type { AppointmentItem } from "./types";

export interface AppointmentActionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: AppointmentItem;
}

/**
 * Server Action to cancel an existing appointment
 */
export async function cancelAppointmentAction(
  _prevState: AppointmentActionResult | null,
  formData: FormData
): Promise<AppointmentActionResult> {
  const parsed = cancelAppointmentSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
    reason: formData.get("reason") || undefined,
  });

  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Invalid input";
    return { success: false, error: errorMsg };
  }

  const { appointmentId, reason } = parsed.data;

  try {
    const res = await apiClient.patch<AppointmentItem>(
      `/appointments/${appointmentId}/cancel`,
      {
        auth: "session",
        body: reason ? { reason } : undefined,
      }
    );

    // Invalidate slot cache tags so the freed slot appears available again
    revalidateTag(CACHE_TAGS.DOCTORS, "max");
    revalidatePath("/appointments");
    revalidatePath("/book");

    return {
      success: true,
      message: "Appointment successfully cancelled.",
      data: res.data,
    };
  } catch (err) {
    if (isApiError(err)) {
      return { success: false, error: err.message };
    }
    return {
      success: false,
      error: "Failed to cancel appointment. Please try again.",
    };
  }
}

/**
 * Server Action to reschedule an appointment to a new slot
 */
export async function rescheduleAppointmentAction(
  _prevState: AppointmentActionResult | null,
  formData: FormData
): Promise<AppointmentActionResult> {
  const parsed = rescheduleAppointmentSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
    newSlotId: formData.get("newSlotId"),
  });

  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Invalid input";
    return { success: false, error: errorMsg };
  }

  const { appointmentId, newSlotId } = parsed.data;

  try {
    const res = await apiClient.patch<AppointmentItem>(
      `/appointments/${appointmentId}/reschedule`,
      {
        auth: "session",
        body: { newSlotId },
      }
    );

    // Invalidate slot cache tags
    revalidateTag(CACHE_TAGS.DOCTORS, "max");
    revalidatePath("/appointments");
    revalidatePath("/book");

    return {
      success: true,
      message: "Appointment successfully rescheduled.",
      data: res.data,
    };
  } catch (err) {
    if (isConflict(err)) {
      return {
        success: false,
        error: "That slot was just booked by another patient. Please select a different slot.",
      };
    }
    if (isApiError(err)) {
      return { success: false, error: err.message };
    }
    return {
      success: false,
      error: "Failed to reschedule appointment. Please try again.",
    };
  }
}
