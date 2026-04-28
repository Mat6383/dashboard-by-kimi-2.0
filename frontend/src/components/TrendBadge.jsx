import React from 'react';

export default function TrendBadge({ trend, style = {} }) {
  if (!trend) return null;

  const config = {
    up: { symbol: '↑', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
    down: { symbol: '↓', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
    stable: { symbol: '→', color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
  };

  const { symbol, color, bg } = config[trend.direction] || config.stable;
  const severityBorder = trend.severity === 'critical' ? `1.5px solid ${color}` : 'none';

  return (
    <span
      title={`z-score: ${trend.zScore} | moyenne: ${trend.mean}`}
      style={{
        fontSize: '0.75rem',
        fontWeight: 700,
        color,
        backgroundColor: bg,
        padding: '2px 6px',
        borderRadius: '4px',
        border: severityBorder,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2px',
        ...style,
      }}
    >
      {symbol} {trend.zScore > 0 ? `+${trend.zScore}` : trend.zScore}
    </span>
  );
}
