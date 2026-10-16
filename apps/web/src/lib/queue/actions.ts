"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { apiClient } from "@/lib/api/client";
import { isApiError, isConflict } from "@/lib/api/types";
import { CACHE_TAGS } from "@/lib/api/cache-tags";
import {
  updateQueueStatusSchema,
  walkInBookingSchema,
  type UpdateQueueStatusInput,
  type WalkInBookingInput,
} from "./validation";
import type { AppointmentItem } from "@/lib/appointments/types";

export interface QueueActionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: unknown;
}

/**
 * Server Action to update an appointment's queue lifecycle status
 * (e.g. CHECKED_IN, IN_CONSULTATION, COMPLETED, NO_SHOW, CANCELLED)
 */
export async function updateQueueStatusAction(
  input: UpdateQueueStatusInput
): Promise<QueueActionResult> {
  const parsed = updateQueueStatusSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid status transition input",
    };
  }

  const { appointmentId, status, reason } = parsed.data;

  try {
    const res = await apiClient.patch<AppointmentItem>(
      `/appointments/${appointmentId}/status`,
      {
        auth: "session",
        body: { status, reason },
      }
    );

    // Revalidate affected operational views
    revalidatePath("/queue");
    revalidatePath("/today");
    revalidatePath("/appointments");

    // If cancelled, free slot tag
    if (status === "CANCELLED") {
      revalidateTag(CACHE_TAGS.DOCTORS, "max");
    }

    return {
      success: true,
      message: `Appointment updated to ${status}.`,
      data: res.data,
    };
  } catch (err) {
    if (isApiError(err)) {
      return { success: false, error: err.message };
    }
    return {
      success: false,
      error: "Failed to update appointment status. Please try again.",
    };
  }
}

/**
 * Server Action to register and book a walk-in patient directly from the reception desk
 */
export async function bookWalkInAction(
  input: WalkInBookingInput
): Promise<QueueActionResult> {
  const parsed = walkInBookingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid walk-in booking details",
    };
  }

  const { slotId, reason, autoCheckIn, doctorId } = parsed.data;

  try {
    // 1. Book appointment as WALK_IN
    const bookRes = await apiClient.post<AppointmentItem>(
      "/appointments",
      {
        slotId,
        reason,
        bookedVia: "WALK_IN",
      },
      {
        auth: "session",
        idempotencyKey: `walkin-${slotId}`,
      }
    );

    const createdAppointment = bookRes.data;

    // 2. If autoCheckIn is requested, immediately check the walk-in patient in
    if (autoCheckIn && createdAppointment?.id) {
      await apiClient.patch(
        `/appointments/${createdAppointment.id}/status`,
        {
          auth: "session",
          body: { status: "CHECKED_IN" },
        }
      ).catch((err) => {
        console.warn("Auto check-in failed after walk-in booking:", err);
      });
    }

    // Invalidate slot availability tags
    revalidateTag(CACHE_TAGS.DOCTORS, "max");
    revalidatePath("/queue");
    revalidatePath("/appointments");
    revalidatePath("/book");

    return {
      success: true,
      message: autoCheckIn
        ? "Walk-in patient booked and checked in to queue!"
        : "Walk-in appointment booked successfully.",
      data: createdAppointment,
    };
  } catch (err) {
    if (isConflict(err)) {
      return {
        success: false,
        error: "This slot was just booked by another patient. Please choose an adjacent slot.",
      };
    }
    if (isApiError(err)) {
      return { success: false, error: err.message };
    }
    return {
      success: false,
      error: "Failed to process walk-in appointment.",
    };
  }
}
