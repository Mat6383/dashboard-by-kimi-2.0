import { useMutation } from '@tanstack/react-query';
import apiService from '../../services/api.service';
import type { ExportMilestones } from '../../services/api.service';

export function useGenerateBackendPDF() {
  return useMutation({
    mutationFn: (params: { projectId: number; milestones: ExportMilestones; format?: string; darkMode?: boolean }) =>
      apiService.generateBackendPDF(params.projectId, params.milestones, params.format, params.darkMode),
  });
}

export function useGenerateCSV() {
  return useMutation({
    mutationFn: (params: { projectId: number; milestones: ExportMilestones }) =>
      apiService.generateCSV(params.projectId, params.milestones),
  });
}

export function useGenerateExcel() {
  return useMutation({
    mutationFn: (params: { projectId: number; milestones: ExportMilestones }) =>
      apiService.generateExcel(params.projectId, params.milestones),
  });
}
