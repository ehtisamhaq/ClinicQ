import type { SlotProposal, BookingConfirmedData } from "./types";

export type AssistantStreamEvent =
  | { event: "text"; data: { text: string } }
  | { event: "tool_status"; data: { message: string } }
  | { event: "proposal"; data: SlotProposal }
  | { event: "booking_confirmed"; data: BookingConfirmedData }
  | { event: "emergency"; data: { message: string } }
  | { event: "error"; data: { message: string } }
  | { event: "done"; data: Record<string, unknown> };

/**
 * Stream assistant events from the BFF route `/api/assistant/chat`
 */
export async function* streamAssistantConversation(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  locale: string = "en",
  signal?: AbortSignal
): AsyncGenerator<AssistantStreamEvent, void, unknown> {
  const res = await fetch("/api/assistant/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ messages, locale }),
    signal,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.message || `Assistant returned HTTP ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("No readable stream received from assistant");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() || "";

      for (const block of blocks) {
        if (!block.trim()) continue;

        let eventType: string = "text";
        let rawData = "";

        for (const line of block.split("\n")) {
          if (line.startsWith("event:")) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            rawData = line.slice(5).trim();
          }
        }

        if (rawData) {
          try {
            const parsed = JSON.parse(rawData);
            yield { event: eventType as any, data: parsed };
          } catch {
            yield { event: eventType as any, data: { text: rawData } };
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
