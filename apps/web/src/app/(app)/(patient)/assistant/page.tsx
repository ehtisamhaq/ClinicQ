import * as React from "react";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { AssistantChat } from "@/features/assistant/assistant-chat";

export const metadata: Metadata = {
  title: "AI Booking Assistant — ClinicQ",
  description: "Conversational health booking assistant: find doctors, check live slots, and book appointments via AI.",
};

export default async function AssistantPage() {
  const user = await getSessionUser();

  return (
    <div className="container max-w-5xl mx-auto px-4 py-6">
      <AssistantChat initialLanguage={user?.preferredLanguage || "en"} />
    </div>
  );
}
