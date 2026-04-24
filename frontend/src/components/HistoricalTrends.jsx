import React, { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Loader2, AlertCircle, Calendar } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { apiClient } from '../services/api.service';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function HistoricalTrends({ projectId, isDark }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState('30'); // jours
  const [granularity, setGranularity] = useState('day');

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      if (!projectId) return;
      setLoading(true);
      try {
        const to = new Date().toISOString().slice(0, 10);
        const from = new Date(Date.now() - parseInt(range) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const res = await apiClient.get(`/dashboard/${projectId}/trends`, {
          params: { granularity, from, to },
          signal: controller.signal,
        });
        setData(res.data.data || []);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError('Impossible de charger les tendances historiques.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [projectId, range, granularity]);

  const chartData = useMemo(() => {
    const labels = data.map((d) => d.period);
    const dataset = (label, key, color) => ({
      label,
      data: data.map((d) => (d[key] != null ? parseFloat(d[key].toFixed(2)) : null)),
      borderColor: color,
      backgroundColor: color + '20',
      fill: false,
      tension: 0.3,
      pointRadius: 3,
    });

    return {
      labels,
      datasets: [
        dataset('Pass Rate', 'pass_rate', '#10B981'),
        dataset('Completion', 'completion_rate', '#3B82F6'),
        dataset('Escape Rate', 'escape_rate', '#EF4444'),
        dataset('Detection', 'detection_rate', '#8B5CF6'),
      ],
    };
  }, [data]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: isDark ? '#E2E8F0' : '#111827' } },
        tooltip: { mode: 'index', intersect: false },
      },
      scales: {
        x: {
          ticks: { color: isDark ? '#9CA3AF' : '#6B7280' },
          grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
        },
        y: {
          ticks: { color: isDark ? '#9CA3AF' : '#6B7280' },
          grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
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

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, color: text }}>📈 Tendances historiques</h2>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: '6px', border, background: cardBg, color: text }}
        >
          <option value="7">7 jours</option>
          <option value="30">30 jours</option>
          <option value="90">90 jours</option>
          <option value="365">1 an</option>
        </select>
        <select
          value={granularity}
          onChange={(e) => setGranularity(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: '6px', border, background: cardBg, color: text }}
        >
          <option value="day">Jour</option>
          <option value="week">Semaine</option>
          <option value="month">Mois</option>
        </select>
      </div>

      {loading && (
        <div className="loading-container">
          <Loader2 size={32} className="spinner" />
          <p>Chargement des tendances...</p>
        </div>
      )}

      {error && (
        <div style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {!loading && !error && data.length === 0 && (
        <div style={{ color: text, opacity: 0.7, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={20} />
          Aucune donnée historique disponible. Les snapshots sont collectés quotidiennement.
        </div>
      )}

      {!loading && !error && data.length > 0 && (
        <div style={{ height: '400px', background: cardBg, border, borderRadius: '8px', padding: '16px' }}>
          <Line data={chartData} options={options} />
        </div>
      )}
    </div>
  );
}
