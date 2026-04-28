import { useQuery } from '@tanstack/react-query';
import apiService from '../../services/api.service';

/**
 * Hook React Query pour récupérer les anomalies d'un projet.
 * @param {number} projectId
 */
export function useAnomalies(projectId) {
  return useQuery({
    queryKey: ['anomalies', projectId],
    queryFn: async () => {
      const res = await apiService.getAnomalies(projectId);
      return res.data ?? [];
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });
}
