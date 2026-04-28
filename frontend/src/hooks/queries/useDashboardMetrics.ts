import { useQuery } from '@tanstack/react-query';
import apiService from '../../services/api.service';
import type { DashboardMetrics } from '../../types/api.types';
import { unwrapApiResponse } from '../../types/api.types';

/**
 * Hook React Query pour les métriques ISTQB d'un projet.
 * @param projectId - ID du projet
 * @param preprodMilestones - IDs des milestones préprod
 * @param prodMilestones - IDs des milestones prod
 */
export interface UseDashboardMetricsOptions {
  autoRefresh?: boolean;
  liveConnected?: boolean;
}

export function useDashboardMetrics(
  projectId: number | null,
  preprodMilestones: number[] | null = null,
  prodMilestones: number[] | null = null,
  options: UseDashboardMetricsOptions = {}
) {
  const { autoRefresh = false, liveConnected = false } = options;

  return useQuery<DashboardMetrics>({
    queryKey: ['dashboard-metrics', projectId, preprodMilestones, prodMilestones],
    queryFn: async ({ signal }) => {
      const [metricsRes, qualityRes] = await Promise.all([
        apiService.getDashboardMetrics(projectId!, preprodMilestones, prodMilestones, signal),
        apiService.getQualityRates(projectId!, preprodMilestones, prodMilestones, signal),
      ]);
      return {
        ...unwrapApiResponse(metricsRes),
        qualityRates: qualityRes.success ? qualityRes.data : null,
      };
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
    refetchInterval: autoRefresh && !liveConnected ? 60000 : false,
  });
}
