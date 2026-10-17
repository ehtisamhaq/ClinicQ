import { apiClient } from "@/lib/api/client";
import type { WaitlistEntryItem } from "./types";

export async function getMyWaitlist(): Promise<WaitlistEntryItem[]> {
  try {
    const res = await apiClient.get<WaitlistEntryItem[] | { entries: WaitlistEntryItem[] }>("/waitlist", {
      auth: "session",
    });

    if (Array.isArray(res.data)) {
      return res.data;
    }

    if (
      res.data &&
      typeof res.data === "object" &&
      "entries" in res.data &&
      Array.isArray((res.data as { entries: WaitlistEntryItem[] }).entries)
    ) {
      return (res.data as { entries: WaitlistEntryItem[] }).entries;
    }

    return [];
  } catch {
    return [];
  }
}
