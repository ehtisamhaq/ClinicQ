"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { apiClient } from "@/lib/api/client";
import { CACHE_TAGS } from "@/lib/api/cache-tags";
import { isConflict, isUnauthorized } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/session";
import { bookManualInputSchema, type BookManualInput } from "./validation";

interface CreatedAppointmentData {
  id: string;
  trackingToken: string;
  status: string;
  reason: string;
  slot: {
    startsAt: string;
    endsAt: string;
    doctor: {
      name: string;
      specialty: string;
      consultationFee: number;
    };
  };
}

export interface BookActionResult {
  success: boolean;
  error?: string;
  conflict?: boolean;
  appointment?: CreatedAppointmentData;
}

/**
 * Server Action: Book a slot manually with transactional double-booking prevention.
 */
export async function bookManualAppointmentAction(
  input: BookManualInput
): Promise<BookActionResult> {
  const parsed = bookManualInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid booking data",
    };
  }

  const token = await getAccessToken();
  if (!token) {
    return {
      success: false,
      error: "Please sign in to confirm your appointment booking.",
    };
  }

  try {
    const res = await apiClient.post<CreatedAppointmentData>("/appointments", {
      slotId: parsed.data.slotId,
      reason: parsed.data.reason,
      bookedVia: "MANUAL",
    }, {
      auth: "session",
      idempotencyKey: `manual-book-${parsed.data.slotId}`,
    });

    // Invalidate slot availability cache tags
    if (parsed.data.doctorId && parsed.data.dateString) {
      revalidateTag(CACHE_TAGS.doctorSlots(parsed.data.doctorId, parsed.data.dateString), "max");
    }
    revalidateTag(CACHE_TAGS.DOCTORS, "max");
    revalidatePath("/appointments");
    revalidatePath("/book");

    return {
      success: true,
      appointment: res.data,
    };
  } catch (err: unknown) {
    if (isConflict(err)) {
      if (parsed.data.doctorId && parsed.data.dateString) {
        revalidateTag(CACHE_TAGS.doctorSlots(parsed.data.doctorId, parsed.data.dateString), "max");
      }
      return {
        success: false,
        conflict: true,
        error: "This slot was just taken by another patient. Please choose another time.",
      };
    }

    if (isUnauthorized(err)) {
      return {
        success: false,
        error: "Your session has expired. Please sign in again.",
      };
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to book appointment",
    };
  }
}
