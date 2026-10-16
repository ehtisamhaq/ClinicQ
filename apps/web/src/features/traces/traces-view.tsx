"use client";

import * as React from "react";
import type { AssistantTrace, TraceStep, TracesResponse } from "@/lib/traces/types";
import {
  IconSearch,
  IconFilter,
  IconRobot,
  IconTimeline,
  IconShieldCheck,
  IconCalendar,
  IconRefresh,
  IconCircleCheck,
  IconAlertTriangle,
  IconInfoCircle,
  IconCode,
  IconCopy,
  IconCheck,
  IconX,
  IconChevronRight,
  IconSparkles,
  IconStethoscope,
  IconArrowBackUp,
} from "@tabler/icons-react";

interface TracesViewProps {
  initialData: TracesResponse;
}

export function TracesView({ initialData }: TracesViewProps) {
  const [traces] = React.useState<AssistantTrace[]>(initialData.data);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedOutcome, setSelectedOutcome] = React.useState("ALL");
  const [selectedTrace, setSelectedTrace] = React.useState<AssistantTrace | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [showRawJson, setShowRawJson] = React.useState(false);

  // Filter traces
  const filteredTraces = React.useMemo(() => {
    return traces.filter((trace) => {
      const matchesSearch =
        trace.requestId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trace.patientId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesOutcome =
        selectedOutcome === "ALL" ||
        (trace.outcome || "").toUpperCase() === selectedOutcome.toUpperCase();

      return matchesSearch && matchesOutcome;
    });
  }, [traces, searchTerm, selectedOutcome]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getOutcomeBadge = (outcome: string | null) => {
    switch (outcome?.toUpperCase()) {
      case "BOOKED":
      case "BOOKING_CONFIRMED":
        return {
          bg: "bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:border-emerald-700/40 dark:text-emerald-400",
          label: "Booked",
          icon: IconCircleCheck,
        };
      case "EMERGENCY_REDIRECTED":
        return {
          bg: "bg-rose-500/10 text-rose-700 border-rose-300 dark:border-rose-700/40 dark:text-rose-400",
          label: "Emergency Alert",
          icon: IconAlertTriangle,
        };
      case "PROPOSED":
      case "SLOT_PROPOSED":
        return {
          bg: "bg-blue-500/10 text-blue-700 border-blue-300 dark:border-blue-700/40 dark:text-blue-400",
          label: "Slot Proposed",
          icon: IconSparkles,
        };
      case "INFO_ANSWERED":
        return {
          bg: "bg-purple-500/10 text-purple-700 border-purple-300 dark:border-purple-700/40 dark:text-purple-400",
          label: "Clinic Info (RAG)",
          icon: IconInfoCircle,
        };
      case "NO_SLOTS_FOUND":
        return {
          bg: "bg-amber-500/10 text-amber-700 border-amber-300 dark:border-amber-700/40 dark:text-amber-400",
          label: "No Slots Found",
          icon: IconCalendar,
        };
      default:
        return {
          bg: "bg-surface-2 text-foreground border-border",
          label: outcome || "Unknown",
          icon: IconTimeline,
        };
    }
  };

  const getNodeIcon = (node: string) => {
    switch (node) {
      case "safetyCheck":
        return <IconShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case "detectIntent":
      case "extractConstraints":
        return <IconSparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      case "searchSlots":
      case "searchDoctors":
        return <IconStethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case "replan":
      case "relaxConstraints":
        return <IconArrowBackUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case "proposeSlot":
        return <IconCalendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case "executeBooking":
        return <IconCircleCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case "answerInfo":
        return <IconInfoCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <IconTimeline className="h-4 w-4 text-muted" />;
    }
  };

  // Stats calculation
  const totalCount = traces.length;
  const bookedCount = traces.filter((t) => t.outcome === "BOOKED" || t.outcome === "BOOKING_CONFIRMED").length;
  const emergencyCount = traces.filter((t) => t.outcome === "EMERGENCY_REDIRECTED").length;
  const replannedCount = traces.filter((t) =>
    (Array.isArray(t.steps) ? t.steps : []).some((s) => (s.replanAttempt ?? 0) > 0 || (s.relaxationsApplied?.length ?? 0) > 0)
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border/80 bg-surface p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-muted text-xs font-medium">
            <IconTimeline className="h-4 w-4 text-primary" />
            <span>Total Traces</span>
          </div>
          <div className="text-2xl font-bold font-serif text-foreground mt-1">
            {totalCount}
          </div>
          <div className="text-[11px] text-muted">All logged executions</div>
        </div>

        <div className="rounded-xl border border-border/80 bg-surface p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-muted text-xs font-medium">
            <IconCircleCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Booked Sessions</span>
          </div>
          <div className="text-2xl font-bold font-serif text-foreground mt-1">
            {bookedCount}
          </div>
          <div className="text-[11px] text-muted">
            {totalCount > 0 ? `${Math.round((bookedCount / totalCount) * 100)}% conversion` : "0%"}
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-surface p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-muted text-xs font-medium">
            <IconArrowBackUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>Replanned</span>
          </div>
          <div className="text-2xl font-bold font-serif text-foreground mt-1">
            {replannedCount}
          </div>
          <div className="text-[11px] text-muted">Autonomous recovery</div>
        </div>

        <div className="rounded-xl border border-border/80 bg-surface p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-muted text-xs font-medium">
            <IconAlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <span>Emergencies</span>
          </div>
          <div className="text-2xl font-bold font-serif text-foreground mt-1">
            {emergencyCount}
          </div>
          <div className="text-[11px] text-muted">Safety triage interventions</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Request ID or Patient ID..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-surface text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <IconFilter className="h-4 w-4 text-muted shrink-0" />
          <select
            value={selectedOutcome}
            onChange={(e) => setSelectedOutcome(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-surface text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Outcomes</option>
            <option value="BOOKED">Booked</option>
            <option value="PROPOSED">Slot Proposed</option>
            <option value="EMERGENCY_REDIRECTED">Emergency Alert</option>
            <option value="NO_SLOTS_FOUND">No Slots Found</option>
            <option value="INFO_ANSWERED">Clinic Info (RAG)</option>
          </select>
        </div>
      </div>

      {/* Traces DataTable */}
      <div className="rounded-2xl border border-border/80 bg-surface overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-surface-2/60 text-xs font-semibold text-muted uppercase tracking-wider">
                <th className="px-5 py-3">Request ID</th>
                <th className="px-5 py-3">Outcome</th>
                <th className="px-5 py-3">Steps</th>
                <th className="px-5 py-3">Replans</th>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredTraces.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted">
                    No assistant traces match your current filter.
                  </td>
                </tr>
              ) : (
                filteredTraces.map((trace) => {
                  const outcomeBadge = getOutcomeBadge(trace.outcome);
                  const Icon = outcomeBadge.icon;
                  const stepsArray = Array.isArray(trace.steps) ? trace.steps : [];
                  const replansCount = stepsArray.filter(
                    (s) => (s.replanAttempt ?? 0) > 0 || (s.relaxationsApplied?.length ?? 0) > 0
                  ).length;
                  const createdAtDate = new Date(trace.createdAt);

                  return (
                    <tr
                      key={trace.id}
                      className="hover:bg-surface-2/40 transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedTrace(trace);
                        setShowRawJson(false);
                      }}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-foreground font-medium">
                            {trace.requestId.slice(0, 8)}…{trace.requestId.slice(-4)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(trace.requestId, trace.id);
                            }}
                            className="p-1 rounded hover:bg-surface-3 text-muted hover:text-foreground transition-colors"
                            title="Copy full Request ID"
                          >
                            {copiedId === trace.id ? (
                              <IconCheck className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <IconCopy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="text-[11px] text-muted">
                          Patient: {trace.patientId ? trace.patientId.slice(0, 8) : "Anonymous"}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${outcomeBadge.bg}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{outcomeBadge.label}</span>
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                          {stepsArray.length} steps
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        {replansCount > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">
                            {replansCount} replan{replansCount > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-xs text-muted">0</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-xs text-muted">
                        <div>{createdAtDate.toLocaleDateString()}</div>
                        <div className="text-[11px] text-muted/80">{createdAtDate.toLocaleTimeString()}</div>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-2 group-hover:bg-primary group-hover:text-primary-foreground border border-border group-hover:border-primary transition-all shadow-2xs"
                        >
                          <span>Inspect</span>
                          <IconChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trace Detail Modal / Drawer */}
      {selectedTrace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-4xl max-h-[90vh] bg-surface rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-border/80 flex items-center justify-between gap-4 bg-surface-2/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <IconRobot className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-serif font-bold text-foreground">
                      Assistant Execution Trace
                    </h2>
                    {(() => {
                      const badge = getOutcomeBadge(selectedTrace.outcome);
                      const Icon = badge.icon;
                      return (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.bg}`}
                        >
                          <Icon className="h-3 w-3" />
                          <span>{badge.label}</span>
                        </span>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-muted mt-0.5">
                    <span>Req: {selectedTrace.requestId}</span>
                    <span>•</span>
                    <span>{new Date(selectedTrace.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    showRawJson
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-surface-2 text-foreground border-border hover:bg-surface-3"
                  }`}
                >
                  <IconCode className="h-3.5 w-3.5" />
                  <span>{showRawJson ? "Timeline View" : "Raw JSON"}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(JSON.stringify(selectedTrace, null, 2), "modal-json")
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-surface-2 hover:bg-surface-3 text-foreground transition-colors"
                >
                  {copiedId === "modal-json" ? (
                    <>
                      <IconCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <IconCopy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTrace(null)}
                  className="p-1.5 rounded-lg border border-border hover:bg-surface-2 text-muted hover:text-foreground transition-colors"
                >
                  <IconX className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {showRawJson ? (
                <pre className="p-4 rounded-xl bg-surface-2 text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap leading-relaxed border border-border">
                  {JSON.stringify(selectedTrace, null, 2)}
                </pre>
              ) : (
                <div className="space-y-6">
                  {/* Step-by-step visual pipeline */}
                  <div className="space-y-4">
                    <h3 className="text-xs uppercase font-semibold tracking-wider text-muted font-sans">
                      Execution Pipeline ({Array.isArray(selectedTrace.steps) ? selectedTrace.steps.length : 0} steps)
                    </h3>

                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
                      {(Array.isArray(selectedTrace.steps) ? selectedTrace.steps : []).map(
                        (step: TraceStep, index: number) => {
                          const replanBadge = (step.replanAttempt ?? 0) > 0;
                          const relaxations = step.relaxationsApplied || [];

                          return (
                            <div key={index} className="relative group">
                              {/* Step circle indicator */}
                              <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-surface border-2 border-primary flex items-center justify-center text-[10px] font-bold text-primary shadow-xs">
                                {index + 1}
                              </div>

                              <div className="rounded-xl border border-border/80 bg-surface-2/40 p-4 space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-surface border border-border/60">
                                      {getNodeIcon(step.node)}
                                    </div>
                                    <span className="font-semibold text-sm text-foreground">
                                      {step.node}
                                    </span>
                                    {replanBadge && (
                                      <span className="px-2 py-0.5 rounded text-[11px] bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold border border-amber-300 dark:border-amber-700/40">
                                        Replan Attempt #{step.replanAttempt}
                                      </span>
                                    )}
                                  </div>

                                  <span className="text-xs font-mono text-muted">
                                    {new Date(step.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>

                                {/* Relaxations notice if any */}
                                {relaxations.length > 0 && (
                                  <div className="rounded-lg bg-amber-500/10 border border-amber-300 dark:border-amber-700/40 p-2.5 text-xs text-amber-900 dark:text-amber-300 space-y-1">
                                    <div className="font-medium flex items-center gap-1.5">
                                      <IconArrowBackUp className="h-3.5 w-3.5" />
                                      <span>Soft Constraints Relaxed:</span>
                                    </div>
                                    <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px]">
                                      {relaxations.map((r, rIdx) => (
                                        <li key={rIdx}>{r}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Tool calls executed */}
                                {step.toolCalls && step.toolCalls.length > 0 && (
                                  <div className="space-y-2 pt-1">
                                    <span className="text-[11px] font-semibold uppercase text-muted tracking-wide">
                                      Tools Executed:
                                    </span>
                                    {step.toolCalls.map((tc, tcIdx) => (
                                      <div
                                        key={tcIdx}
                                        className="rounded-lg border border-border/60 bg-surface p-3 space-y-2 text-xs"
                                      >
                                        <div className="flex items-center gap-2 font-mono text-xs font-semibold text-primary">
                                          <span>→ {tc.name}()</span>
                                        </div>

                                        {tc.args && Object.keys(tc.args).length > 0 && (
                                          <div>
                                            <span className="text-[10px] uppercase font-bold text-muted">Arguments:</span>
                                            <pre className="mt-0.5 p-2 rounded bg-surface-2 font-mono text-[11px] text-foreground overflow-x-auto">
                                              {JSON.stringify(tc.args, null, 2)}
                                            </pre>
                                          </div>
                                        )}

                                        {tc.result !== undefined && (
                                          <div>
                                            <span className="text-[10px] uppercase font-bold text-muted">Return Value:</span>
                                            <pre className="mt-0.5 p-2 rounded bg-surface-2 font-mono text-[11px] text-foreground overflow-x-auto max-h-40">
                                              {JSON.stringify(tc.result, null, 2)}
                                            </pre>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Output preview */}
                                {step.output !== undefined && (
                                  <div className="pt-1">
                                    <span className="text-[10px] uppercase font-bold text-muted">Node Output:</span>
                                    <pre className="mt-0.5 p-2 rounded bg-surface font-mono text-[11px] text-foreground overflow-x-auto border border-border/40">
                                      {typeof step.output === "object"
                                        ? JSON.stringify(step.output, null, 2)
                                        : String(step.output)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border/80 bg-surface-2/30 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTrace(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium border border-border bg-surface hover:bg-surface-2 text-foreground transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
