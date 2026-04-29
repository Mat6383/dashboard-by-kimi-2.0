import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, RotateCcw, Eye } from 'lucide-react';

const VARIABLES = ['metric', 'value', 'threshold', 'severity', 'projectName', 'timestamp'];

export default function AlertTemplates({ isDark, templates, onSave, savePending }) {
  const { t } = useTranslation();
  const [local, setLocal] = useState({
    emailTemplate: '',
    slackTemplate: '',
    teamsTemplate: '',
  });

  useEffect(() => {
    setLocal({
      emailTemplate: templates.emailTemplate || '',
      slackTemplate: templates.slackTemplate || '',
      teamsTemplate: templates.teamsTemplate || '',
    });
  }, [templates.emailTemplate, templates.slackTemplate, templates.teamsTemplate]);

  const previewVars = {
    metric: 'passRate',
    value: '87.5',
    threshold: '90',
    severity: 'critical',
    projectName: 'Projet Alpha',
    timestamp: new Date().toISOString(),
  };

  const replaceVars = (text) => {
    if (!text) return '';
    return text
      .replace(/\{\{metric\}\}/g, previewVars.metric)
      .replace(/\{\{value\}\}/g, previewVars.value)
      .replace(/\{\{threshold\}\}/g, previewVars.threshold)
      .replace(/\{\{severity\}\}/g, previewVars.severity)
      .replace(/\{\{projectName\}\}/g, previewVars.projectName)
      .replace(/\{\{timestamp\}\}/g, previewVars.timestamp);
  };

  const cardStyle = {
    backgroundColor: isDark ? '#1e293b' : '#f9fafb',
    border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '16px',
  };

  const textareaStyle = {
    width: '100%',
    minHeight: '120px',
    padding: '10px',
    borderRadius: '6px',
    border: `1px solid ${isDark ? '#475569' : '#d1d5db'}`,
    backgroundColor: isDark ? '#0f172a' : '#fff',
    color: isDark ? '#f1f5f9' : '#1f2937',
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    resize: 'vertical',
  };

  const previewStyle = {
    padding: '12px',
    borderRadius: '6px',
    backgroundColor: isDark ? '#0f172a' : '#fff',
    border: `1px solid ${isDark ? '#475569' : '#d1d5db'}`,
    minHeight: '80px',
    whiteSpace: 'pre-wrap',
  };

  const renderSection = (label, key) => (
    <div style={cardStyle} key={key}>
      <h3 style={{ marginTop: 0, marginBottom: '12px' }}>{label}</h3>
      <textarea
        style={textareaStyle}
        value={local[key]}
        onChange={(e) => setLocal({ ...local, [key]: e.target.value })}
        placeholder={t('notifications.templatePlaceholder') || 'Écrivez votre template en Markdown...'}
      />
      <div style={{ marginTop: '12px' }}>
        <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <Eye size={14} /> {t('notifications.preview') || 'Aperçu'}
        </strong>
        <div style={previewStyle}>{replaceVars(local[key]) || (t('notifications.noPreview') || 'Aucun aperçu')}</div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{t('notifications.availableVariables') || 'Variables disponibles'}:</span>
        {VARIABLES.map((v) => (
          <code
            key={v}
            style={{
              fontSize: '0.75rem',
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: isDark ? '#334155' : '#e5e7eb',
              color: isDark ? '#e2e8f0' : '#374151',
            }}
          >
            {'{{' + v + '}}'}
          </code>
        ))}
      </div>

      {renderSection(t('notifications.emailTemplate') || 'Template Email', 'emailTemplate')}
      {renderSection(t('notifications.slackTemplate') || 'Template Slack', 'slackTemplate')}
      {renderSection(t('notifications.teamsTemplate') || 'Template Teams', 'teamsTemplate')}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          className="btn-toggle"
          onClick={() => onSave(local)}
          disabled={savePending}
          type="button"
          style={{ backgroundColor: '#10B981', color: '#fff', border: 'none' }}
        >
          <Save size={16} />
          {savePending ? (t('common.saving') || 'Sauvegarde...') : (t('common.save') || 'Sauvegarder')}
        </button>
        <button
          className="btn-toggle"
          onClick={() => setLocal({ emailTemplate: '', slackTemplate: '', teamsTemplate: '' })}
          type="button"
        >
          <RotateCcw size={16} />
          {t('common.reset') || 'Réinitialiser'}
        </button>
      </div>
    </div>
  );
}
