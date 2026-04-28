/**
 * ================================================
 * FEATURE FLAGS ADMIN — CRUD + Rollout %
 * ================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ToggleLeft,
  ToggleRight,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  SlidersHorizontal,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import apiService from '../services/api.service';
import { useToast } from '../hooks/useToast';

function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function FeatureFlagsAdmin({ isDark }) {
  const { showToast } = useToast();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState(null);

  const [form, setForm] = useState({
    key: '',
    enabled: false,
    description: '',
    rolloutPercentage: 100,
  });

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getFeatureFlagsAdmin();
      setFlags(res.data || []);
    } catch (err) {
      showToast('Erreur chargement des flags', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const openCreate = () => {
    setEditingFlag(null);
    setForm({ key: '', enabled: false, description: '', rolloutPercentage: 100 });
    setModalOpen(true);
  };

  const openEdit = (flag) => {
    setEditingFlag(flag);
    setForm({
      key: flag.key,
      enabled: flag.enabled,
      description: flag.description || '',
      rolloutPercentage: flag.rolloutPercentage ?? 100,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingFlag(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingFlag) {
        await apiService.updateFeatureFlag(editingFlag.key, {
          enabled: form.enabled,
          description: form.description,
          rolloutPercentage: form.rolloutPercentage,
        });
        showToast('Flag mis à jour', 'success');
      } else {
        await apiService.createFeatureFlag({
          key: form.key,
          enabled: form.enabled,
          description: form.description,
          rolloutPercentage: form.rolloutPercentage,
        });
        showToast('Flag créé', 'success');
      }
      closeModal();
      fetchFlags();
    } catch (err) {
      showToast(err.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (key) => {
    if (!window.confirm(`Supprimer le flag "${key}" ?`)) return;
    try {
      await apiService.deleteFeatureFlag(key);
      showToast('Flag supprimé', 'success');
      fetchFlags();
    } catch (err) {
      showToast(err.message || 'Erreur suppression', 'error');
    }
  };

  const handleToggleEnabled = async (flag) => {
    try {
      await apiService.updateFeatureFlag(flag.key, { enabled: !flag.enabled });
      setFlags((prev) => prev.map((f) => (f.key === flag.key ? { ...f, enabled: !f.enabled } : f)));
      showToast(`Flag ${flag.key} ${!flag.enabled ? 'activé' : 'désactivé'}`, 'success');
    } catch (err) {
      showToast('Erreur toggle', 'error');
    }
  };

  const handleRolloutChange = async (flag, value) => {
    const num = Math.min(100, Math.max(0, Number(value)));
    try {
      await apiService.updateFeatureFlag(flag.key, { rolloutPercentage: num });
      setFlags((prev) => prev.map((f) => (f.key === flag.key ? { ...f, rolloutPercentage: num } : f)));
    } catch (err) {
      showToast('Erreur mise à jour rollout', 'error');
    }
  };

  const theme = {
    container: {
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto',
      color: isDark ? '#e5e7eb' : '#1f2937',
    },
    card: {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: isDark ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.05)',
      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '20px',
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    btnPrimary: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 16px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: '#3B82F6',
      color: '#fff',
      fontWeight: 600,
      cursor: 'pointer',
      fontSize: '0.875rem',
    },
    btnSecondary: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 16px',
      borderRadius: '8px',
      border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
      backgroundColor: isDark ? '#374151' : '#f9fafb',
      color: isDark ? '#e5e7eb' : '#374151',
      fontWeight: 600,
      cursor: 'pointer',
      fontSize: '0.875rem',
    },
    btnDanger: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '6px',
      border: 'none',
      backgroundColor: '#EF4444',
      color: '#fff',
      fontWeight: 600,
      cursor: 'pointer',
      fontSize: '0.75rem',
    },
    btnIcon: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      borderRadius: '6px',
      border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
      backgroundColor: 'transparent',
      color: isDark ? '#9ca3af' : '#6b7280',
      cursor: 'pointer',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '0.875rem',
    },
    th: {
      textAlign: 'left',
      padding: '12px 16px',
      borderBottom: `2px solid ${isDark ? '#374151' : '#e5e7eb'}`,
      fontWeight: 600,
      color: isDark ? '#9ca3af' : '#6b7280',
      textTransform: 'uppercase',
      fontSize: '0.75rem',
      letterSpacing: '0.05em',
    },
    td: {
      padding: '12px 16px',
      borderBottom: `1px solid ${isDark ? '#374151' : '#f3f4f6'}`,
      verticalAlign: 'middle',
    },
    toggleBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 0,
      display: 'inline-flex',
      alignItems: 'center',
    },
    slider: {
      width: '120px',
      accentColor: '#3B82F6',
    },
    modalOverlay: {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px',
    },
    modal: {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      width: '100%',
      maxWidth: '480px',
      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      borderRadius: '6px',
      border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
      backgroundColor: isDark ? '#111827' : '#ffffff',
      color: isDark ? '#e5e7eb' : '#1f2937',
      fontSize: '0.875rem',
      marginTop: '4px',
    },
    label: {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: 500,
      marginBottom: '4px',
      color: isDark ? '#d1d5db' : '#374151',
    },
    formGroup: {
      marginBottom: '16px',
    },
    emptyState: {
      textAlign: 'center',
      padding: '48px 24px',
      color: isDark ? '#9ca3af' : '#6b7280',
    },
  };

  return (
    <div style={theme.container}>
      <div style={theme.card}>
        <div style={theme.header}>
          <h1 style={theme.title}>
            <SlidersHorizontal size={24} color="#3B82F6" />
            Feature Flags
          </h1>
          <button style={theme.btnPrimary} onClick={openCreate} type="button">
            <Plus size={16} />
            Nouveau flag
          </button>
        </div>

        {loading && flags.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <Loader2 size={32} className="spinning" color="#3B82F6" />
          </div>
        ) : flags.length === 0 ? (
          <div style={theme.emptyState}>
            <AlertTriangle size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>Aucun feature flag configuré.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={theme.table}>
              <thead>
                <tr>
                  <th style={theme.th}>Flag</th>
                  <th style={theme.th}>Description</th>
                  <th style={theme.th}>Actif</th>
                  <th style={theme.th}>Rollout %</th>
                  <th style={theme.th}>Créé le</th>
                  <th style={theme.th}>Modifié le</th>
                  <th style={{ ...theme.th, width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {flags.map((flag) => (
                  <tr key={flag.key}>
                    <td style={theme.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <code
                          style={{
                            backgroundColor: isDark ? '#111827' : '#f3f4f6',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                          }}
                        >
                          {flag.key}
                        </code>
                        {flag.enabled &&
                          flag.rolloutPercentage != null &&
                          flag.rolloutPercentage > 0 &&
                          flag.rolloutPercentage < 100 && (
                            <span
                              title={`Rollout progressif : ${flag.rolloutPercentage}% des utilisateurs`}
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: '#92400E',
                                backgroundColor: '#FEF3C7',
                                padding: '1px 6px',
                                borderRadius: '999px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.03em',
                              }}
                            >
                              Bêta / {flag.rolloutPercentage}%
                            </span>
                          )}
                      </div>
                    </td>
                    <td style={theme.td}>{flag.description || '-'}</td>
                    <td style={theme.td}>
                      <button
                        style={theme.toggleBtn}
                        onClick={() => handleToggleEnabled(flag)}
                        title={flag.enabled ? 'Désactiver' : 'Activer'}
                        type="button"
                      >
                        {flag.enabled ? (
                          <ToggleRight size={24} color="#10B981" />
                        ) : (
                          <ToggleLeft size={24} color="#9CA3AF" />
                        )}
                      </button>
                    </td>
                    <td style={theme.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={flag.rolloutPercentage ?? 100}
                          style={theme.slider}
                          onChange={(e) => handleRolloutChange(flag, e.target.value)}
                          disabled={!flag.enabled}
                        />
                        <span style={{ fontVariantNumeric: 'tabular-nums', minWidth: '36px' }}>
                          {flag.rolloutPercentage ?? 100}%
                        </span>
                      </div>
                    </td>
                    <td style={theme.td}>{formatDate(flag.createdAt)}</td>
                    <td style={theme.td}>{formatDate(flag.updatedAt)}</td>
                    <td style={theme.td}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button style={theme.btnIcon} onClick={() => openEdit(flag)} title="Modifier" type="button">
                          <Pencil size={14} />
                        </button>
                        <button
                          style={{ ...theme.btnIcon, color: '#EF4444' }}
                          onClick={() => handleDelete(flag.key)}
                          title="Supprimer"
                          type="button"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Create / Edit */}
      {modalOpen && (
        <div style={theme.modalOverlay} onClick={closeModal}>
          <div style={theme.modal} onClick={(e) => e.stopPropagation()}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}
            >
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                {editingFlag ? 'Modifier le flag' : 'Nouveau flag'}
              </h2>
              <button style={{ ...theme.btnIcon, border: 'none' }} onClick={closeModal} type="button">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={theme.formGroup}>
                <label style={theme.label}>Clé</label>
                <input
                  style={theme.input}
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                  placeholder="ex: annualTrendsV2"
                  required
                  disabled={!!editingFlag}
                />
              </div>

              <div style={theme.formGroup}>
                <label style={theme.label}>Description</label>
                <input
                  style={theme.input}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description du flag"
                />
              </div>

              <div style={theme.formGroup}>
                <label style={theme.label}>Actif</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    style={theme.toggleBtn}
                    onClick={() => setForm({ ...form, enabled: !form.enabled })}
                  >
                    {form.enabled ? (
                      <ToggleRight size={28} color="#10B981" />
                    ) : (
                      <ToggleLeft size={28} color="#9CA3AF" />
                    )}
                  </button>
                  <span style={{ fontSize: '0.875rem' }}>{form.enabled ? 'Oui' : 'Non'}</span>
                </div>
              </div>

              <div style={theme.formGroup}>
                <label style={theme.label}>Rollout %</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={form.rolloutPercentage}
                    style={theme.slider}
                    onChange={(e) => setForm({ ...form, rolloutPercentage: Number(e.target.value) })}
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.rolloutPercentage}
                    style={{ ...theme.input, width: '72px', marginTop: 0 }}
                    onChange={(e) => setForm({ ...form, rolloutPercentage: Number(e.target.value) })}
                  />
                  <span style={{ fontSize: '0.875rem' }}>%</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button type="button" style={theme.btnSecondary} onClick={closeModal}>
                  Annuler
                </button>
                <button type="submit" style={theme.btnPrimary} disabled={saving}>
                  {saving ? <Loader2 size={16} className="spinning" /> : <Save size={16} />}
                  {saving ? 'Sauvegarde...' : editingFlag ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
