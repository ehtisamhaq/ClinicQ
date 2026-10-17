import * as React from "react";
import type { Metadata } from "next";
import { getKnowledgeDocs } from "@/lib/admin/queries";
import { KnowledgeManager } from "@/features/admin/knowledge-manager";

export const metadata: Metadata = {
  title: "Clinic Knowledge Base — ClinicQ",
  description: "Manage institutional knowledge, services, fees, timings and FAQs embedded with pgvector for AI.",
};

export default async function AdminKnowledgePage() {
  const docs = await getKnowledgeDocs();

  return (
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
  );
}
