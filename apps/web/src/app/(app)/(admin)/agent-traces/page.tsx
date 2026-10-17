import * as React from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getAssistantTraces } from "@/lib/traces/queries";
import { TracesView } from "@/features/traces/traces-view";
import { IconTimeline } from "@tabler/icons-react";

export default function AgentTracesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
          <IconTimeline className="h-4 w-4" />
          <span>Audit &amp; Explainability</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mt-1">
          Agent Execution Traces
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Inspect the end-to-end execution of the AI booking assistant. Review visited graph nodes, tool calls, autonomous constraint replanning, and final booking decisions.
        </p>
      </div>

      {/* Content stream wrapped in Suspense for PPR */}
      <React.Suspense fallback={<TracesSkeleton />}>
        <TracesContent />
      </React.Suspense>
    </div>
  );
}

async function TracesContent() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  const initialTraces = await getAssistantTraces({ limit: 50 });

  return <TracesView initialData={initialTraces} />;
}

function TracesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="h-24 rounded-xl border border-border bg-card"></div>
        <div className="h-24 rounded-xl border border-border bg-card"></div>
        <div className="h-24 rounded-xl border border-border bg-card"></div>
        <div className="h-24 rounded-xl border border-border bg-card"></div>
      </div>
      <div className="h-10 rounded-lg border border-border bg-card max-w-md"></div>
      <div className="h-96 rounded-2xl border border-border bg-card"></div>
    </div>
  );
}
