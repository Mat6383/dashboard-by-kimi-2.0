import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../../services/api.service';
import type { NotificationSettings } from '../../types/api.types';

export function useSaveNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: NotificationSettings) => apiService.saveNotificationSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
    },
  });
}

export function useTestNotificationWebhook() {
  return useMutation({
    mutationFn: ({ channel, url }: { channel: string; url: string }) =>
      apiService.testNotificationWebhook(channel, url),
  });
}
