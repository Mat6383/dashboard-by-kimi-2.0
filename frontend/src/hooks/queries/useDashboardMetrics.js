import { useQuery } from '@tanstack/react-query';
import apiService from '../../services/api.service';

/**
 * Hook React Query pour les métriques ISTQB d'un projet.
 * @param {number} projectId
 * @param {number[]|null} preprodMilestones
 * @param {number[]|null} prodMilestones
 */
export function useDashboardMetrics(projectId, preprodMilestones = null, prodMilestones = null) {
  return useQuery({
    queryKey: ['dashboard-metrics', projectId, preprodMilestones, prodMilestones],
    queryFn: async ({ signal }) => {
      const [metricsRes, qualityRes] = await Promise.all([
        apiService.getDashboardMetrics(projectId, preprodMilestones, prodMilestones, signal),
        apiService.getQualityRates(projectId, preprodMilestones, prodMilestones, signal),
      ]);
      return {
        ...metricsRes.data,
        qualityRates: qualityRes.success ? qualityRes.data : null,
      };
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });
}
