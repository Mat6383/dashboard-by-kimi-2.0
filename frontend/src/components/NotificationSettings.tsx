/**
 * ================================================
 * NOTIFICATION SETTINGS — Configuration alertes
 * ================================================
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../hooks/useToast';
import { trpc } from '../trpc/client';
import { useSaveNotificationSettings, useTestNotificationWebhook } from '../hooks/mutations/useNotifications';
import { Bell, Mail, MessageSquare, Send, Save, TestTube } from 'lucide-react';

export default function NotificationSettings({ isDark }) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { data: settingsData, isLoading: loading } = trpc.notifications.settings.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const [settings, setSettings] = useState({
    email: '',
    slackWebhook: '',
    teamsWebhook: '',
    enabledSlaEmail: false,
    enabledSlaSlack: false,
    enabledSlaTeams: false,
  });

  useEffect(() => {
    if (settingsData?.data) {
      const data = settingsData.data as any;
      setSettings({
        email: data.email || '',
        slackWebhook: data.slack_webhook || '',
        teamsWebhook: data.teams_webhook || '',
        enabledSlaEmail: !!data.enabled_sla_email,
        enabledSlaSlack: !!data.enabled_sla_slack,
        enabledSlaTeams: !!data.enabled_sla_teams,
      });
    }
  }, [settingsData]);

  const saveMutation = useSaveNotificationSettings();
  const testMutation = useTestNotificationWebhook();

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({
        email: settings.email,
        slackWebhook: settings.slackWebhook,
        teamsWebhook: settings.teamsWebhook,
        enabledSlaEmail: settings.enabledSlaEmail,
        enabledSlaSlack: settings.enabledSlaSlack,
        enabledSlaTeams: settings.enabledSlaTeams,
      } as any);
      showToast(t('notifications.settingsSaved'), 'success');
    } catch (err) {
      showToast(t('notifications.saveError'), 'error');
    }
  };

  const handleTest = async (channel: string) => {
    const url = channel === 'slack' ? settings.slackWebhook : settings.teamsWebhook;
    if (!url) {
      showToast(t('notifications.webhookNotConfigured', { channel }), 'error');
      return;
    }
    try {
      await testMutation.mutateAsync({ channel, url });
      showToast(t('notifications.testSent', { channel }), 'success');
    } catch (err) {
      showToast(t('notifications.testFailed', { channel }), 'error');
    }
  };

  const cardStyle = {
    backgroundColor: isDark ? '#1e293b' : '#f9fafb',
    border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '16px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 500,
    marginBottom: '6px',
    color: isDark ? '#e2e8f0' : '#374151',
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: `1px solid ${isDark ? '#475569' : '#d1d5db'}`,
    backgroundColor: isDark ? '#0f172a' : '#fff',
    color: isDark ? '#f1f5f9' : '#1f2937',
    fontSize: '0.875rem',
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <Bell size={24} />
        {t('notifications.title')}
      </h2>

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <>
          <div style={cardStyle}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
              <Mail size={18} />
              {t('notifications.emailSla')}
            </h3>
            <label style={labelStyle}>{t('notifications.emailAddress')}</label>
            <input
              type="email"
              style={inputStyle}
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              placeholder="alerts@neo-logix.local"
            />
            <label style={{ ...labelStyle, marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={settings.enabledSlaEmail}
                onChange={(e) => setSettings({ ...settings, enabledSlaEmail: e.target.checked })}
              />
              {t('notifications.enableEmailAlerts')}
            </label>
          </div>

          <div style={cardStyle}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
              <MessageSquare size={18} />
              Slack
            </h3>
            <label style={labelStyle}>{t('notifications.webhookUrl')}</label>
            <input
              type="url"
              style={inputStyle}
              value={settings.slackWebhook}
              onChange={(e) => setSettings({ ...settings, slackWebhook: e.target.value })}
              placeholder="https://hooks.slack.com/services/..."
            />
            <div style={{ marginTop: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <label style={{ ...labelStyle, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={settings.enabledSlaSlack}
                  onChange={(e) => setSettings({ ...settings, enabledSlaSlack: e.target.checked })}
                />
                {t('notifications.enableSlackAlerts')}
              </label>
              <button className="btn-toggle" onClick={() => handleTest('slack')} type="button">
                <TestTube size={14} />
                {t('common.test')}
              </button>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
              <Send size={18} />
              Microsoft Teams
            </h3>
            <label style={labelStyle}>{t('notifications.webhookUrl')}</label>
            <input
              type="url"
              style={inputStyle}
              value={settings.teamsWebhook}
              onChange={(e) => setSettings({ ...settings, teamsWebhook: e.target.value })}
              placeholder="https://neo-logix.webhook.office.com/webhookb2/..."
            />
            <div style={{ marginTop: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <label style={{ ...labelStyle, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={settings.enabledSlaTeams}
                  onChange={(e) => setSettings({ ...settings, enabledSlaTeams: e.target.checked })}
                />
                {t('notifications.enableTeamsAlerts')}
              </label>
              <button className="btn-toggle" onClick={() => handleTest('teams')} type="button">
                <TestTube size={14} />
                {t('common.test')}
              </button>
            </div>
          </div>

          <button
            className="btn-toggle"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            type="button"
            style={{ backgroundColor: '#10B981', color: '#fff', border: 'none' }}
          >
            <Save size={16} />
            {saveMutation.isPending ? t('common.saving') : t('common.save')}
          </button>
        </>
      )}
    </div>
  );
}
