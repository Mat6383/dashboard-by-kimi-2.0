import { useMutation } from '@tanstack/react-query';
import apiService from '../../services/api.service';
import type { ReportGenerateParams } from '../../services/api.service';

export function useGenerateReport() {
  return useMutation({
    mutationFn: (params: ReportGenerateParams) => apiService.generateReport(params),
  });
}
