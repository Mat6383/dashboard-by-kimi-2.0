/**
 * Types API frontend — miroir des types backend.
 * Source de vérité : backend/types/api.types.ts
 */

// ─── Feature Flags ───────────────────────────────────────────────────────────
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  rolloutPercentage: number;
  updatedAt: string;
  createdAt: string;
}

export interface FeatureFlagCreateInput {
  key: string;
  enabled?: boolean;
  description?: string;
  rolloutPercentage?: number;
}

export interface FeatureFlagUpdateInput {
  enabled?: boolean;
  description?: string;
  rolloutPercentage?: number;
}

// ─── Webhooks ────────────────────────────────────────────────────────────────
export interface WebhookSubscription {
  id: number;
  url: string;
  events: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Projects ────────────────────────────────────────────────────────────────
export interface Project {
  id: number;
  name: string;
}

// ─── Dashboard Metrics ───────────────────────────────────────────────────────
export interface DashboardMetrics {
  completionRate: number;
  passRate: number;
  failureRate: number;
  blockedRate: number;
  escapeRate: number;
  detectionRate: number;
  testEfficiency: number;
  qualityRates: QualityRates | null;
  raw: RawMetrics;
  runs: Run[];
  slaStatus: SlaStatus;
}

export interface QualityRates {
  escapeRate: number;
  detectionRate: number;
}

export interface RawMetrics {
  completed: number;
  total: number;
  passed: number;
  failed: number;
  blocked: number;
  skipped: number;
  wip: number;
  untested: number;
  success: number;
  failure: number;
}

export interface Run {
  id: number;
  name: string;
  total: number;
  completed: number;
  passed: number;
  failed: number;
  blocked: number;
  wip: number;
  untested: number;
  completionRate: number;
  passRate: number;
  isExploratory: boolean;
  isClosed: boolean;
  created_at: string;
}

export interface SlaStatus {
  ok: boolean;
  alerts: Array<{ severity: string; metric: string }>;
}

// ─── Réponses standard ───────────────────────────────────────────────────────
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
