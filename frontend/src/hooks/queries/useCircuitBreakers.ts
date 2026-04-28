import { useQuery } from '@tanstack/react-query';
import apiService from '../../services/api.service';

export const CIRCUIT_BREAKERS_KEY = ['circuit-breakers'] as const;

export interface CircuitBreakerState {
  name: string;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  lastFailure: string | null;
}

/**
 * Hook React Query pour récupérer l'état des circuit breakers.
 * @param options - Configuration optionnelle
 */
export function useCircuitBreakers({ autoRefresh = false }: { autoRefresh?: boolean } = {}) {
  return useQuery<CircuitBreakerState[]>({
    queryKey: CIRCUIT_BREAKERS_KEY,
    queryFn: async () => {
      const res = await apiService.getCircuitBreakers();
      return res.data ?? [];
    },
    staleTime: 30 * 1000,
    refetchInterval: autoRefresh ? 30 * 1000 : false,
  });
}
