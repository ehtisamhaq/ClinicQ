import * as React from "react";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { AssistantChat } from "@/features/assistant/assistant-chat";

export const metadata: Metadata = {
  title: "AI Booking Assistant — ClinicQ",
  description: "Conversational health booking assistant: find doctors, check live slots, and book appointments via AI.",
};

export default function AssistantPage() {
  return (
    <div className="container max-w-5xl mx-auto px-4 py-6">
      <React.Suspense fallback={<AssistantLoadingSkeleton />}>
        <AssistantContent />
      </React.Suspense>
    </div>
  );
}

async function AssistantContent() {
  const user = await getSessionUser();
  return <AssistantChat initialLanguage={user?.preferredLanguage || "en"} />;
}

function AssistantLoadingSkeleton() {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 animate-pulse">
      <div className="h-12 w-48 bg-muted rounded-xl" />
      <div className="h-64 bg-muted/40 rounded-2xl" />
      <div className="h-14 bg-muted/60 rounded-xl" />
    </div>
  );
}
