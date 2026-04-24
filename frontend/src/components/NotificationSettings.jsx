/**
 * ================================================
 * NOTIFICATION SETTINGS — Configuration alertes
 * ================================================
 */

import React, { useState, useEffect } from 'react';
import apiService from '../services/api.service';
import { useToast } from '../hooks/useToast';
import { Bell, Mail, MessageSquare, Send, Save, TestTube } from 'lucide-react';

export default function NotificationSettings({ isDark }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    email: '',
    slackWebhook: '',
    teamsWebhook: '',
    enabledSlaEmail: false,
    enabledSlaSlack: false,
    enabledSlaTeams: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await apiService.getNotificationSettings();
      if (res.data) {
        setSettings({
          email: res.data.email || '',
          slackWebhook: res.data.slack_webhook || '',
          teamsWebhook: res.data.teams_webhook || '',
          enabledSlaEmail: !!res.data.enabled_sla_email,
          enabledSlaSlack: !!res.data.enabled_sla_slack,
          enabledSlaTeams: !!res.data.enabled_sla_teams,
        });
      }
    } catch (err) {
      showToast('Erreur chargement settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.saveNotificationSettings({
        email: settings.email,
        slackWebhook: settings.slackWebhook,
        teamsWebhook: settings.teamsWebhook,
        enabledSlaEmail: settings.enabledSlaEmail,
        enabledSlaSlack: settings.enabledSlaSlack,
        enabledSlaTeams: settings.enabledSlaTeams,
      });
      showToast('Paramètres sauvegardés', 'success');
    } catch (err) {
      showToast('Erreur sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (channel) => {
    const url = channel === 'slack' ? settings.slackWebhook : settings.teamsWebhook;
    if (!url) {
      showToast(`Webhook ${channel} non configuré`, 'error');
      return;
    }
    try {
      await apiService.testNotificationWebhook(channel, url);
      showToast(`Test ${channel} envoyé`, 'success');
    } catch (err) {
      showToast(`Test ${channel} échoué`, 'error');
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
        Configuration des notifications
      </h2>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <>
          <div style={cardStyle}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
              <Mail size={18} />
              Email SLA
            </h3>
            <label style={labelStyle}>Adresse email</label>
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
              Activer les alertes SLA par email
            </label>
          </div>

          <div style={cardStyle}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
              <MessageSquare size={18} />
              Slack
            </h3>
            <label style={labelStyle}>Webhook URL</label>
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
                Activer les alertes SLA sur Slack
              </label>
              <button className="btn-toggle" onClick={() => handleTest('slack')} type="button">
                <TestTube size={14} />
                Tester
              </button>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
              <Send size={18} />
              Microsoft Teams
            </h3>
            <label style={labelStyle}>Webhook URL</label>
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
                Activer les alertes SLA sur Teams
              </label>
              <button className="btn-toggle" onClick={() => handleTest('teams')} type="button">
                <TestTube size={14} />
                Tester
              </button>
            </div>
          </div>

          <button
            className="btn-toggle"
            onClick={handleSave}
            disabled={saving}
            type="button"
            style={{ backgroundColor: '#10B981', color: '#fff', border: 'none' }}
          >
            <Save size={16} />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </>
      )}
    </div>
  );
}
