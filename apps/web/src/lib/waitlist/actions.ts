"use server";

import { revalidatePath } from "next/cache";
import { apiClient } from "@/lib/api/client";

export async function joinWaitlistAction(
  doctorId: string,
  fromDate?: string,
  toDate?: string
) {
  try {
    const now = new Date();
    const from = fromDate || now.toISOString();
    const to =
      toDate || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const res = await apiClient.post(
      "/waitlist",
      { doctorId, from, to },
      { auth: "session" }
    );
    revalidatePath("/appointments");
    revalidatePath("/book");
    return {
      success: true,
      message: "You have been added to the doctor's priority waitlist!",
      data: res.data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to join waitlist. Please try again.",
    };
  }
}

export async function leaveWaitlistAction(id: string) {
  try {
    await apiClient.delete(`/waitlist/${id}`, { auth: "session" });
    revalidatePath("/appointments");
    return { success: true, message: "Removed from waitlist." };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to leave waitlist.",
    };
  }
}
