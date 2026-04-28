import { useQuery } from '@tanstack/react-query';
import apiService from '../../services/api.service';

export const MULTI_PROJECT_SUMMARY_KEY = ['multi-project-summary'] as const;

export interface MultiProjectSummaryItem {
  projectId: number;
  projectName: string;
  passRate: number | null;
  completionRate: number | null;
  blockedRate: number | null;
  escapeRate: number | null;
  detectionRate: number | null;
  slaStatus: { ok: boolean; alerts: Array<{ severity: string; metric: string }> };
}

/**
 * Hook React Query pour la synthèse multi-projets.
 */
export function useMultiProjectSummary() {
  return useQuery<MultiProjectSummaryItem[]>({
    queryKey: MULTI_PROJECT_SUMMARY_KEY,
    queryFn: async () => {
      const res = await apiService.getMultiProjectSummary();
      return res.data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });
}
