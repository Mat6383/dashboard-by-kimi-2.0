import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Shield, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import apiService from '../services/api.service';
import type { AuditLog } from '../types/api.types';
import { unwrapApiResponse } from '../types/api.types';

const ACTION_LABELS: Record<string, string> = {
  'cache.clear': 'Nettoyage cache',
  'feature-flag.update': 'Mise à jour feature flag',
  'sync.execute': 'Exécution sync',
  'sync.config.update': 'Mise à jour config auto-sync',
  'report.generate': 'Génération rapport',
  'export.csv': 'Export CSV',
  'export.excel': 'Export Excel',
  'export.pdf': 'Export PDF',
  'notification.settings.update': 'Mise à jour notifications',
  'notification.test': 'Test notification',
  'rbac.denied': 'Accès refusé (RBAC)',
};

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function StatusBadge({ success }: { success: boolean }) {
  return (
    <span
      className="status-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
        color: success ? '#10B981' : '#EF4444',
      }}
    >
      {success ? 'Succès' : 'Échec'}
    </span>
  );
}

export default function AuditLogViewer({ isDark }: { isDark: boolean }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const [filters, setFilters] = useState<{ action: string; from: string; to: string }>({
    action: '',
    from: '',
    to: '',
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { limit, offset };
      if (filters.action) params.action = filters.action;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const result = await apiService.getAuditLogs(params);
      setLogs(unwrapApiResponse(result));
      setTotal('total' in result ? result.total : 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [filters, offset]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const themeStyles: Record<string, React.CSSProperties> = {
    container: {
      padding: '24px',
      maxWidth: '1400px',
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
    filterRow: {
      display: 'flex',
      gap: '12px',
      marginBottom: '20px',
      flexWrap: 'wrap',
    },
    input: {
      padding: '8px 12px',
      borderRadius: '8px',
      border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
      backgroundColor: isDark ? '#374151' : '#ffffff',
      color: isDark ? '#e5e7eb' : '#1f2937',
      fontSize: '0.875rem',
    },
    select: {
      padding: '8px 12px',
      borderRadius: '8px',
      border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
      backgroundColor: isDark ? '#374151' : '#ffffff',
      color: isDark ? '#e5e7eb' : '#1f2937',
      fontSize: '0.875rem',
    },
    btnPrimary: {
      padding: '8px 16px',
      borderRadius: '8px',
      backgroundColor: '#3B82F6',
      color: '#ffffff',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '0.875rem',
    },
    th: {
      textAlign: 'left',
      padding: '12px',
      borderBottom: `2px solid ${isDark ? '#374151' : '#e5e7eb'}`,
      fontWeight: 600,
      color: isDark ? '#9ca3af' : '#6b7280',
      whiteSpace: 'nowrap',
    },
    td: {
      padding: '12px',
      borderBottom: `1px solid ${isDark ? '#374151' : '#f3f4f6'}`,
      verticalAlign: 'top',
    },
    pagination: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: '20px',
      fontSize: '0.875rem',
    },
    pageBtn: {
      padding: '6px 12px',
      borderRadius: '6px',
      border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
      backgroundColor: isDark ? '#374151' : '#ffffff',
      color: isDark ? '#e5e7eb' : '#1f2937',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
  };

  return (
    <div style={themeStyles.container}>
      <div style={themeStyles.card}>
        <div style={themeStyles.header}>
          <h2 style={themeStyles.title}>
            <Shield size={24} color="#3B82F6" />
            Journal d&apos;Audit
          </h2>
          <button style={themeStyles.btnPrimary} onClick={fetchLogs} disabled={loading} type="button">
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Recharger
          </button>
        </div>

        <div style={themeStyles.filterRow}>
          <Filter size={16} color="#9ca3af" />
          <select
            style={themeStyles.select}
            value={filters.action}
            onChange={(e) => {
              setOffset(0);
              setFilters((f) => ({ ...f, action: e.target.value }));
            }}
          >
            <option value="">Toutes les actions</option>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="date"
            data-testid="audit-date-from"
            style={themeStyles.input}
            value={filters.from}
            onChange={(e) => {
              setOffset(0);
              setFilters((f) => ({ ...f, from: e.target.value }));
            }}
            placeholder="Du"
          />
          <input
            type="date"
            data-testid="audit-date-to"
            style={themeStyles.input}
            value={filters.to}
            onChange={(e) => {
              setOffset(0);
              setFilters((f) => ({ ...f, to: e.target.value }));
            }}
            placeholder="Au"
          />
        </div>

        {error && (
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239,68,68,0.1)',
              color: '#EF4444',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={themeStyles.table}>
            <thead>
              <tr>
                <th style={themeStyles.th}>Timestamp</th>
                <th style={themeStyles.th}>Utilisateur</th>
                <th style={themeStyles.th}>Action</th>
                <th style={themeStyles.th}>Ressource</th>
                <th style={themeStyles.th}>Méthode / Path</th>
                <th style={themeStyles.th}>Statut HTTP</th>
                <th style={themeStyles.th}>Résultat</th>
                <th style={themeStyles.th}>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    Aucune entrée d&apos;audit trouvée.
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={themeStyles.td}>{formatDate(log.timestamp)}</td>
                  <td style={themeStyles.td}>
                    {log.actor_email ? (
                      <>
                        <div>{log.actor_email}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{log.actor_role}</div>
                      </>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>—</span>
                    )}
                  </td>
                  <td style={themeStyles.td}>
                    <span style={{ fontWeight: 500 }}>{ACTION_LABELS[log.action] || log.action}</span>
                  </td>
                  <td style={themeStyles.td}>
                    {log.resource}
                    {log.resource_id ? ` / ${log.resource_id}` : ''}
                  </td>
                  <td style={themeStyles.td}>
                    <code
                      style={{
                        fontSize: '0.75rem',
                        backgroundColor: isDark ? '#374151' : '#f3f4f6',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {log.method}
                    </code>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>{log.path}</div>
                  </td>
                  <td style={themeStyles.td}>{log.status_code ?? '—'}</td>
                  <td style={themeStyles.td}>
                    <StatusBadge success={log.success} />
                  </td>
                  <td style={themeStyles.td}>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{log.ip}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={themeStyles.pagination}>
            <button
              style={{ ...themeStyles.pageBtn, opacity: offset === 0 ? 0.5 : 1 }}
              onClick={() => setOffset((o) => Math.max(0, o - limit))}
              disabled={offset === 0}
              type="button"
            >
              <ChevronLeft size={16} /> Précédent
            </button>
            <span>
              Page {currentPage} / {totalPages} — {total} entrées
            </span>
            <button
              style={{ ...themeStyles.pageBtn, opacity: offset + limit >= total ? 0.5 : 1 }}
              onClick={() => setOffset((o) => o + limit)}
              disabled={offset + limit >= total}
              type="button"
            >
              Suivant <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
