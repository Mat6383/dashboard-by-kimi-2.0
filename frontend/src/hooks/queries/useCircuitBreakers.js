import { useQuery } from '@tanstack/react-query';
import apiService from '../../services/api.service';

export const CIRCUIT_BREAKERS_KEY = ['circuit-breakers'];

/**
 * Hook React Query pour récupérer l'état des circuit breakers.
 * @param {Object} options
 * @param {boolean} [options.autoRefresh] - Active le refetch toutes les 30s
 */
export function useCircuitBreakers({ autoRefresh = false } = {}) {
  return useQuery({
    queryKey: CIRCUIT_BREAKERS_KEY,
    queryFn: async () => {
      const res = await apiService.getCircuitBreakers();
      return res.data ?? [];
    },
    staleTime: 30 * 1000,
    refetchInterval: autoRefresh ? 30 * 1000 : false,
  });
}
