import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../../services/api.service';
import type { AutoSyncConfig } from '../../types/api.types';

export function useUpdateAutoSyncConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<AutoSyncConfig>) => apiService.updateAutoSyncConfig(patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-sync-config'] });
    },
  });
}
