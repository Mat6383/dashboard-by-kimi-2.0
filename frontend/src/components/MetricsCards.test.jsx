import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MetricsCards, { getColorByThreshold, getColorForFailure } from './MetricsCards';

describe('MetricsCards', () => {
  const mockMetrics = {
    completionRate: 92,
    passRate: 96,
    failureRate: 3,
    testEfficiency: 97,
    raw: {
      total: 100,
      completed: 92,
      passed: 96,
      failed: 3,
      blocked: 1,
      skipped: 0
    },
    slaStatus: {
      ok: true,
      alerts: []
    },
    statusDistribution: {
      labels: ['Passed', 'Failed', 'Blocked', 'Skipped'],
      values: [96, 3, 1, 0],
      colors: ['#10B981', '#EF4444', '#F59E0B', '#6B7280']
    }
  };

  it('renders loading state when metrics is null', () => {
    render(<MetricsCards metrics={null} useBusiness={false} />);
    expect(screen.getByText(/Chargement des métriques/i)).toBeInTheDocument();
  });

  it('renders four metric cards with correct values', () => {
    render(<MetricsCards metrics={mockMetrics} useBusiness={false} />);

    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('Pass Rate')).toBeInTheDocument();
    expect(screen.getByText('Failure Rate')).toBeInTheDocument();
    expect(screen.getByText('Test Efficiency')).toBeInTheDocument();

    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('96%')).toBeInTheDocument();
    expect(screen.getByText('3%')).toBeInTheDocument();
    expect(screen.getByText('97%')).toBeInTheDocument();
  });

  it('renders business terms when useBusiness is true', () => {
    render(<MetricsCards metrics={mockMetrics} useBusiness={true} />);

    expect(screen.getByText("Taux d'Exécution")).toBeInTheDocument();
    expect(screen.getByText('Taux de Succès')).toBeInTheDocument();
    expect(screen.getByText("Taux d'Échec")).toBeInTheDocument();
    expect(screen.getByText('Efficience des Tests')).toBeInTheDocument();
  });

  it('displays SLA alert when present', () => {
    const metricsWithAlert = {
      ...mockMetrics,
      slaStatus: {
        ok: false,
        alerts: [
          { metric: 'Pass Rate', severity: 'warning', message: 'Pass rate en warning: 88%' }
        ]
      }
    };

    render(<MetricsCards metrics={metricsWithAlert} useBusiness={false} />);
    expect(screen.getByText(/Pass rate en warning/i)).toBeInTheDocument();
  });
});

describe('getColorByThreshold', () => {
  it('returns green when value >= target', () => {
    expect(getColorByThreshold(95, 90, 80)).toBe('#10B981');
  });

  it('returns orange when value >= warning but < target', () => {
    expect(getColorByThreshold(85, 90, 80)).toBe('#F59E0B');
  });

  it('returns red when value < warning', () => {
    expect(getColorByThreshold(75, 90, 80)).toBe('#EF4444');
  });
});

describe('getColorForFailure', () => {
  it('returns green when failure <= 5%', () => {
    expect(getColorForFailure(3)).toBe('#10B981');
  });

  it('returns orange when failure <= 10%', () => {
    expect(getColorForFailure(8)).toBe('#F59E0B');
  });

  it('returns red when failure > 10%', () => {
    expect(getColorForFailure(15)).toBe('#EF4444');
  });
});
