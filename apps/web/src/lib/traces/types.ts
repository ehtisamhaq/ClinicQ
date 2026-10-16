export interface ToolCallRecord {
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
}

export interface TraceStep {
  node: string;
  timestamp: string;
  inputs?: Record<string, unknown>;
  toolCalls?: ToolCallRecord[];
  replanAttempt?: number;
  relaxationsApplied?: string[];
  output?: unknown;
}

export interface AssistantTrace {
  id: string;
  clinicId: string;
  patientId: string;
  requestId: string;
  steps: TraceStep[];
  outcome: string | null;
  createdAt: string;
}

export interface TracesFilterOptions {
  page?: number;
  limit?: number;
  outcome?: string;
  patientId?: string;
}

export interface TracesResponse {
  data: AssistantTrace[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
