import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../../services/api.service';

export function useClearCache() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiService.clearCache(),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
