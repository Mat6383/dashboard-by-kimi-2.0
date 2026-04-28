import { useQuery } from '@tanstack/react-query';
import apiService from '../../services/api.service';
import type { DashboardMetrics } from '../../types/api.types';

/**
 * Hook React Query pour les métriques ISTQB d'un projet.
 * @param projectId - ID du projet
 * @param preprodMilestones - IDs des milestones préprod
 * @param prodMilestones - IDs des milestones prod
 */
export function useDashboardMetrics(
  projectId: number | null,
  preprodMilestones: number[] | null = null,
  prodMilestones: number[] | null = null
) {
  return useQuery<DashboardMetrics>({
    queryKey: ['dashboard-metrics', projectId, preprodMilestones, prodMilestones],
    queryFn: async ({ signal }) => {
      const [metricsRes, qualityRes] = await Promise.all([
        apiService.getDashboardMetrics(projectId!, preprodMilestones, prodMilestones, signal),
        apiService.getQualityRates(projectId!, preprodMilestones, prodMilestones, signal),
      ]);
      return {
        ...metricsRes.data,
        qualityRates: qualityRes.success ? qualityRes.data : null,
      } as DashboardMetrics;
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });
}
