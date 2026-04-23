import { describe, it, expect, vi, beforeEach } from 'vitest';

// Définir les mocks AVANT l'import du service
const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();

vi.mock('axios', () => ({
  __esModule: true,
  default: {
    create: () => ({
      get: (...args) => mockGet(...args),
      post: (...args) => mockPost(...args),
      put: (...args) => mockPut(...args),
      delete: (...args) => mockDelete(...args),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    }),
  },
}));

// Import du service APRÈS le mock
const { default: apiService } = await import('./api.service');

describe('api.service', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockPut.mockReset();
    mockDelete.mockReset();
  });

  it('healthCheck appelle GET /health', async () => {
    mockGet.mockResolvedValue({ data: { status: 'ok' } });
    const result = await apiService.healthCheck();
    expect(mockGet).toHaveBeenCalledWith('/health');
    expect(result).toEqual({ status: 'ok' });
  });

  it('getProjects appelle GET /projects', async () => {
    mockGet.mockResolvedValue({ data: { data: [] } });
    await apiService.getProjects();
    expect(mockGet).toHaveBeenCalledWith('/projects');
  });

  it('getDashboardMetrics sérialise les milestones en join(', ')', async () => {
    mockGet.mockResolvedValue({ data: { success: true } });
    await apiService.getDashboardMetrics(1, [10, 20], [30, 40]);
    expect(mockGet).toHaveBeenCalledWith('/dashboard/1', {
      params: { preprodMilestones: '10,20', prodMilestones: '30,40' },
    });
  });

  it('getDashboardMetrics passe le signal AbortController', async () => {
    const controller = new AbortController();
    mockGet.mockResolvedValue({ data: { success: true } });
    await apiService.getDashboardMetrics(1, null, null, controller.signal);
    expect(mockGet).toHaveBeenCalledWith('/dashboard/1', {
      params: {},
      signal: controller.signal,
    });
  });

  it('getDashboardMetrics relance AbortError', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    mockGet.mockRejectedValue(abortError);
    await expect(apiService.getDashboardMetrics(1)).rejects.toThrow('Aborted');
  });

  it('getQualityRates retourne { success: false } en cas d erreur (pas de throw)', async () => {
    mockGet.mockRejectedValue(new Error('Network Error'));
    const result = await apiService.getQualityRates(1);
    expect(result).toEqual({ success: false });
  });

  it('getQualityRates relance AbortError', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    mockGet.mockRejectedValue(abortError);
    await expect(apiService.getQualityRates(1)).rejects.toThrow('Aborted');
  });

  it('getProjectMilestones unwrap double .data.data', async () => {
    mockGet.mockResolvedValue({ data: { data: { result: ['M1', 'M2'] } } });
    const result = await apiService.getProjectMilestones(1);
    expect(result).toEqual({ result: ['M1', 'M2'] });
  });

  it('getProjectRuns passe active=true par défaut', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await apiService.getProjectRuns(1);
    expect(mockGet).toHaveBeenCalledWith('/projects/1/runs', { params: { active: true } });
  });

  it('getRunResults passe le statusFilter', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await apiService.getRunResults(1, '3,5');
    expect(mockGet).toHaveBeenCalledWith('/runs/1/results', { params: { status: '3,5' } });
  });

  it('generateReport utilise un timeout de 120s', async () => {
    mockPost.mockResolvedValue({ data: { success: true } });
    await apiService.generateReport({ projectId: 1 });
    expect(mockPost).toHaveBeenCalledWith('/reports/generate', { projectId: 1 }, { timeout: 120000 });
  });

  it('previewSync utilise un timeout de 60s', async () => {
    mockPost.mockResolvedValue({ data: { data: {} } });
    await apiService.previewSync('neo-pilot', 'R10');
    expect(mockPost).toHaveBeenCalledWith(
      '/sync/preview',
      { projectId: 'neo-pilot', iterationName: 'R10' },
      { timeout: 60000 }
    );
  });

  it('getSyncProjects unwrap .data.data', async () => {
    mockGet.mockResolvedValue({ data: { data: [{ id: 'p1' }] } });
    const result = await apiService.getSyncProjects();
    expect(result).toEqual([{ id: 'p1' }]);
  });

  it('deleteCrosstestComment retourne response.data.deleted', async () => {
    mockDelete.mockResolvedValue({ data: { deleted: true } });
    const result = await apiService.deleteCrosstestComment(42);
    expect(mockDelete).toHaveBeenCalledWith('/crosstest/comments/42');
    expect(result).toBe(true);
  });

  it('_handleError formate le message', async () => {
    mockGet.mockRejectedValue({ response: { data: { error: 'Not found' } }, message: 'Network error' });
    await expect(apiService.getProjects()).rejects.toThrow('Get Projects: Not found');
  });
});
