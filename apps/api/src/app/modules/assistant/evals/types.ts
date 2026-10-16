import type { ChatMessage } from "../types";

export interface EvalScenario {
  id: string;
  name: string;
  category:
    | "emergency"
    | "clear_symptoms"
    | "vague_symptoms"
    | "bangla_english"
    | "hard_constraints"
    | "soft_relaxation"
    | "replan_cap"
    | "consent_safety"
    | "clinic_info"
    | "slot_taken"
    | "reschedule_cancel"
    | "tenant_isolation"
    | "idempotency"
    | "provider_outage";
  description: string;
  messages: ChatMessage[];
  contextOverride?: {
    patientId?: string;
    clinicId?: string;
    simulateProviderOutage?: boolean;
    simulateSlotTaken?: boolean;
  };
  expected: {
    isEmergency?: boolean;
    expectedSpecialty?: string;
    expectedTools?: string[];
    expectOutcome?: string;
    expectedMaxFee?: number;
    expectedGender?: string;
    replanCapCheck?: boolean; // Must not exceed 3 replans
    zeroConsentViolations?: boolean;
    expectInfoAnswered?: boolean;
    expectErrorEvent?: boolean;
    expectTenantIsolation?: boolean;
    expectIdempotency?: boolean;
  };
}

export interface EvalScenarioResult {
  scenarioId: string;
  name: string;
  category: string;
  passed: boolean;
  turns: number;
  checks: {
    toolCorrectness: boolean;
    replanLimitRespected: boolean;
    hardConstraintConsentRespected: boolean;
    emergencyDetectedCorrectly: boolean;
    specialtyCorrect: boolean;
    tenantIsolationRespected: boolean;
    idempotent: boolean;
    errorHandledGracefully: boolean;
  };
  failureReasons: string[];
  traceOutcome?: string;
}

export interface EvalReport {
  timestamp: string;
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  overallPassRate: number;
  metrics: {
    toolAndConstraintCorrectnessRate: number;
    replanLimitAdherenceRate: number;
    hardConstraintConsentViolations: number;
    emergencyDetectionRate: number;
    correctSpecialtyRate: number;
    tenantIsolationViolations: number;
    idempotencyPassRate: number;
    providerOutageHandledRate: number;
    averageTurnsToBooking: number;
  };
  scenarioResults: EvalScenarioResult[];
  failureAnalysis: string[];
}
