import { useQuery } from '@tanstack/react-query';
import apiService from '../../services/api.service';

export const CIRCUIT_BREAKERS_KEY = ['circuit-breakers'];

/**
 * Hook React Query pour récupérer l'état des circuit breakers.
 */
export function useCircuitBreakers() {
  return useQuery({
    queryKey: CIRCUIT_BREAKERS_KEY,
    queryFn: async () => {
      const res = await apiService.getCircuitBreakers();
      return res.data ?? [];
    },
    staleTime: 30 * 1000, // 30s (changements possibles)
  });
}
