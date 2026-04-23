import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MultiProjectDashboard from './MultiProjectDashboard';
import apiService from '../services/api.service';

vi.mock('../services/api.service', () => ({
  default: {
    getMultiProjectSummary: vi.fn(),
  },
}));

describe('MultiProjectDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    apiService.getMultiProjectSummary.mockReturnValue(new Promise(() => {}));
    render(<MultiProjectDashboard isDark={false} />);
    expect(screen.getByText(/Chargement/i)).toBeInTheDocument();
  });

  it('renders multi-project summary', async () => {
    apiService.getMultiProjectSummary.mockResolvedValue({
      data: [
        {
          projectId: 1,
          projectName: 'Alpha',
          passRate: 92.5,
          completionRate: 88.0,
          blockedRate: 2.0,
          escapeRate: 5.0,
          detectionRate: 95.0,
          slaStatus: { ok: true, alerts: [] },
        },
        {
          projectId: 2,
          projectName: 'Beta',
          passRate: 80.0,
          completionRate: 75.0,
          blockedRate: 8.0,
          escapeRate: 12.0,
          detectionRate: 88.0,
          slaStatus: { ok: false, alerts: [{ severity: 'critical', metric: 'Pass Rate' }] },
        },
      ],
    });

    render(<MultiProjectDashboard isDark={false} />);

    await waitFor(() => expect(screen.getByText('Alpha')).toBeInTheDocument());
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('92.5%')).toBeInTheDocument();
    expect(screen.getByText('80.0%')).toBeInTheDocument();
  });

  it('renders error state on failure', async () => {
    apiService.getMultiProjectSummary.mockRejectedValue(new Error('Network error'));
    render(<MultiProjectDashboard isDark={false} />);

    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument());
  });
});
