import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotificationSettings from './NotificationSettings';

const mockShowToast = vi.fn();
const mockGetSettings = vi.fn();
const mockSaveSettings = vi.fn();
const mockTestWebhook = vi.fn();

vi.mock('../hooks/useToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

vi.mock('../services/api.service', () => ({
  default: {
    getNotificationSettings: () => mockGetSettings(),
    saveNotificationSettings: (s) => mockSaveSettings(s),
    testNotificationWebhook: (c, u) => mockTestWebhook(c, u),
  },
}));

describe('NotificationSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSettings.mockResolvedValue({ success: true, data: null });
  });

  it('renders settings form', async () => {
    render(<NotificationSettings isDark={false} />);
    await waitFor(() => expect(screen.getByText(/Configuration des notifications/i)).toBeInTheDocument());
    expect(screen.getByPlaceholderText(/alerts@neo-logix.local/i)).toBeInTheDocument();
  });

  it('loads existing settings', async () => {
    mockGetSettings.mockResolvedValue({
      success: true,
      data: { email: 'admin@test.com', slack_webhook: 'https://slack.test', enabled_sla_email: 1 },
    });
    render(<NotificationSettings isDark={false} />);
    await waitFor(() => expect(screen.getByDisplayValue('admin@test.com')).toBeInTheDocument());
  });

  it('saves settings on button click', async () => {
    mockSaveSettings.mockResolvedValue({});
    render(<NotificationSettings isDark={false} />);
    await waitFor(() => expect(screen.getByText(/Sauvegarder/i)).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/alerts@neo-logix.local/i), {
      target: { value: 'new@test.com' },
    });
    fireEvent.click(screen.getByText(/Sauvegarder/i));

    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('Paramètres sauvegardés', 'success'));
  });

  it('tests slack webhook', async () => {
    mockTestWebhook.mockResolvedValue({});
    render(<NotificationSettings isDark={false} />);
    await waitFor(() => expect(screen.getAllByText(/Tester/i).length).toBeGreaterThan(0));

    const slackInput = screen.getAllByPlaceholderText(/hooks.slack.com/i)[0];
    fireEvent.change(slackInput, { target: { value: 'https://hooks.slack.com/test' } });
    fireEvent.click(screen.getAllByText(/Tester/i)[0]);

    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('Test slack envoyé', 'success'));
  });

  it('shows error toast on save failure', async () => {
    mockSaveSettings.mockRejectedValue(new Error('fail'));
    render(<NotificationSettings isDark={false} />);
    await waitFor(() => expect(screen.getByText(/Sauvegarder/i)).toBeInTheDocument());

    fireEvent.click(screen.getByText(/Sauvegarder/i));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('Erreur sauvegarde', 'error'));
  });
});
