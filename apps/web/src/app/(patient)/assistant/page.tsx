import * as React from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionUser } from "@/lib/auth/session";
import { AssistantChat } from "@/features/assistant/assistant-chat";

export const metadata: Metadata = {
  title: "AI Booking Assistant — ClinicQ",
  description: "Conversational health booking assistant: find doctors, check live slots, and book appointments via AI.",
};

function AssistantSkeleton() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1 p-6 sm:p-8 space-y-6">
        <Skeleton className="h-10 w-72 rounded-lg" />
        <Skeleton className="h-[calc(100vh-14rem)] w-full max-w-4xl mx-auto rounded-2xl" />
      </div>
    </div>
  );
}

async function AssistantContent() {
  const user = await getSessionUser();

  return (
    <AppShell user={user}>
      <div className="container max-w-5xl mx-auto px-4 py-6">
        <AssistantChat initialLanguage={user?.preferredLanguage || "en"} />
      </div>
    </AppShell>
  );
}

export default function AssistantPage() {
  return (
    <React.Suspense fallback={<AssistantSkeleton />}>
      <AssistantContent />
    </React.Suspense>
  );
}
