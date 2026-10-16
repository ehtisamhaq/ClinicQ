import * as React from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionUser } from "@/lib/auth/session";
import { getKnowledgeDocs } from "@/lib/admin/queries";
import { KnowledgeManager } from "@/features/admin/knowledge-manager";

export const metadata: Metadata = {
  title: "Clinic Knowledge Base — ClinicQ",
  description: "Manage institutional knowledge, services, fees, timings and FAQs embedded with pgvector for AI.",
};

function KnowledgeSkeleton() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1 p-6 sm:p-8 space-y-6">
        <Skeleton className="h-10 w-72 rounded-lg" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

async function KnowledgeContent() {
  const [user, docs] = await Promise.all([
    getSessionUser(),
    getKnowledgeDocs(),
  ]);

  return (
    <AppShell user={user}>
      <div className="container max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Clinic Knowledge Base (RAG)
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
            Administer institutional FAQs, service catalog, visiting hours, and fees. All content is stored with pgvector embeddings for accurate AI assistant retrieval.
          </p>
        </div>

        <KnowledgeManager initialDocs={docs} />
      </div>
    </AppShell>
  );
}

export default function AdminKnowledgePage() {
  return (
    <React.Suspense fallback={<KnowledgeSkeleton />}>
      <KnowledgeContent />
    </React.Suspense>
  );
}
