import React, { useState, useEffect, useMemo } from 'react';
import { Radar } from 'react-chartjs-2';
import { Loader2, AlertCircle, GitCompare } from 'lucide-react';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { apiClient } from '../services/api.service';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function CompareDashboard({ isDark }) {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient
      .get('/projects')
      .then((res) => setProjects(res.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selected.length < 2) {
      setData([]);
      return;
    }
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/dashboard/compare', {
          params: { projectIds: selected.join(',') },
          signal: controller.signal,
        });
        setData(res.data.data || []);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError('Erreur lors de la comparaison.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [selected]);

  const chartData = useMemo(() => {
    const labels = ['Pass Rate', 'Completion', 'Escape Rate', 'Detection', 'Blocked'];
    const datasets = data.map((d, i) => ({
      label: d.projectName,
      data: [d.passRate, d.completionRate, d.escapeRate, d.detectionRate, d.blockedRate],
      borderColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][i % 5],
      backgroundColor: ['#3B82F620', '#10B98120', '#F59E0B20', '#EF444420', '#8B5CF620'][i % 5],
      pointRadius: 4,
    }));
    return { labels, datasets };
  }, [data]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: isDark ? '#E2E8F0' : '#111827' } },
      },
      scales: {
        r: {
          ticks: { color: isDark ? '#9CA3AF' : '#6B7280', backdropColor: 'transparent' },
          grid: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
          pointLabels: { color: isDark ? '#E2E8F0' : '#111827' },
          min: 0,
          max: 100,
        },
      },
    }),
    [isDark]
  );

  const cardBg = isDark ? '#1e293b' : '#f9fafb';
  const border = isDark ? '#334155' : '#e5e7eb';
  const text = isDark ? '#f1f5f9' : '#1f2937';

  const toggleProject = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: text }}>
        <GitCompare size={24} />
        Comparateur multi-projets
      </h2>
      <p style={{ color: text, opacity: 0.7 }}>Sélectionnez 2 à 4 projets à comparer</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '16px 0' }}>
        {projects.map((p) => {
          const active = selected.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => toggleProject(p.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: `2px solid ${active ? '#3B82F6' : border}`,
                background: active ? '#3B82F6' : cardBg,
                color: active ? '#fff' : text,
                cursor: 'pointer',
                fontWeight: 500,
              }}
              type="button"
            >
              {p.name}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="loading-container">
          <Loader2 size={32} className="spinner" />
        </div>
      )}

      {error && (
        <div style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {!loading && data.length > 0 && (
        <div style={{ height: '500px', background: cardBg, border, borderRadius: '8px', padding: '16px' }}>
          <Radar data={chartData} options={options} />
        </div>
      )}

      {!loading && data.length > 0 && (
        <div style={{ marginTop: '24px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', color: text }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${border}` }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Projet</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Pass Rate</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Completion</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Escape</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Detection</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Blocked</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.projectId} style={{ borderBottom: `1px solid ${border}` }}>
                  <td style={{ padding: '8px', fontWeight: 500 }}>{d.projectName}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{d.passRate}%</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{d.completionRate}%</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{d.escapeRate}%</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{d.detectionRate}%</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{d.blockedRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
