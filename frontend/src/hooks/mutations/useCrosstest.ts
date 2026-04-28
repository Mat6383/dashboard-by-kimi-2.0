import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../../services/api.service';

interface SaveCommentVariables {
  iid: number;
  comment: string;
  milestoneContext?: string | null;
}

export function useSaveCrosstestComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ iid, comment, milestoneContext }: SaveCommentVariables) =>
      apiService.saveCrosstestComment(iid, comment, milestoneContext ?? null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crosstest-comments'] });
    },
  });
}

export function useDeleteCrosstestComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (iid: number) => apiService.deleteCrosstestComment(iid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crosstest-comments'] });
    },
  });
}
