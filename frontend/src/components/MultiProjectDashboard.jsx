import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api.service';
import { BarChart3, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import '../styles/MultiProjectDashboard.css';

function getPassRateClass(value) {
  if (value === null) return '';
  if (value < 85) return 'rate-critical';
  if (value < 90) return 'rate-warning';
  return 'rate-ok';
}

function getBlockedRateClass(value) {
  if (value === null) return '';
  if (value > 5) return 'rate-critical';
  return 'rate-ok';
}

function getCompletionRateClass(value) {
  if (value === null) return '';
  if (value < 80) return 'rate-warning';
  return 'rate-ok';
}

export default function MultiProjectDashboard({ isDark: _isDark }) {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getMultiProjectSummary();
      setSummaries(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mpd-state">
        <Loader2 size={36} className="mpd-spinner" />
        <p>Chargement de la synthèse multi-projets…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mpd-state mpd-state-error">
        <AlertTriangle size={36} />
        <p>Erreur de chargement</p>
        <p className="mpd-state-desc">{error}</p>
        <button className="mpd-btn" onClick={load}>
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="mpd-container">
      <div className="mpd-header">
        <BarChart3 size={22} />
        SYNTHÈSE MULTI-PROJETS
      </div>

      {summaries.length === 0 ? (
        <div className="mpd-state">
          <p>Aucun projet trouvé.</p>
        </div>
      ) : (
        <div className="mpd-table-wrapper">
          <table className="mpd-table">
            <thead>
              <tr>
                <th>Projet</th>
                <th>Pass Rate</th>
                <th>Completion</th>
                <th>Blocked</th>
                <th>Escape Rate</th>
                <th>Detection</th>
                <th>SLA</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => (
                <tr key={s.projectId}>
                  <td className="mpd-project-name">{s.projectName}</td>
                  <td className={getPassRateClass(s.passRate)}>
                    {s.passRate !== null ? `${s.passRate.toFixed(1)}%` : '—'}
                  </td>
                  <td className={getCompletionRateClass(s.completionRate)}>
                    {s.completionRate !== null ? `${s.completionRate.toFixed(1)}%` : '—'}
                  </td>
                  <td className={getBlockedRateClass(s.blockedRate)}>
                    {s.blockedRate !== null ? `${s.blockedRate.toFixed(1)}%` : '—'}
                  </td>
                  <td>{s.escapeRate !== null ? `${s.escapeRate.toFixed(1)}%` : '—'}</td>
                  <td>{s.detectionRate !== null ? `${s.detectionRate.toFixed(1)}%` : '—'}</td>
                  <td>
                    {s.slaStatus?.ok ? (
                      <span className="mpd-sla-ok">
                        <CheckCircle2 size={14} /> OK
                      </span>
                    ) : (
                      <span className="mpd-sla-ko">
                        <AlertTriangle size={14} /> {s.slaStatus?.alerts?.length || 0}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
