/**
 * ================================================
 * PRODUCTION SECTION — Dashboard4 Production
 * ================================================
 * Escape Rate + Detection Rate (DDP) avec toggle visibilité.
 *
 * @author Matou - Neo-Logix QA Lead
 * @version 1.0.0
 */

import React from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import TrendBadge from './TrendBadge';

function getTrend(anomalies, metricKey) {
  return anomalies?.find((a) => a.metric === metricKey) || null;
}

export default function ProductionSection({
  rates,
  escapeOk,
  ddpOk,
  showProductionSection,
  onToggleProductionSection,
  isDark,
  useBusiness,
  anomalies,
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', color: 'var(--text-color)', margin: 0 }}>
          {useBusiness ? 'PRODUCTION' : 'PRODUCTION'}
        </h2>
        {onToggleProductionSection && (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}
            onClick={() => onToggleProductionSection(!showProductionSection)}
            role="switch"
            aria-checked={showProductionSection}
            tabIndex={0}
          >
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: showProductionSection ? '#10B981' : 'var(--text-muted)',
                transition: 'color 0.3s',
              }}
            >
              {showProductionSection ? 'Visible' : 'Masqué'}
            </span>
            <div
              style={{
                width: '44px',
                height: '22px',
                backgroundColor: showProductionSection
                  ? '#10B981'
                  : isDark
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.1)',
                borderRadius: '11px',
                position: 'relative',
                transition: 'background-color 0.3s ease',
                border: showProductionSection ? '1px solid #059669' : '1px solid var(--border-color)',
                boxShadow: showProductionSection
                  ? '0 0 8px rgba(16, 185, 129, 0.3)'
                  : 'inset 0 2px 4px rgba(0,0,0,0.05)',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2px',
                  left: showProductionSection ? '24px' : '2px',
                  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                }}
              />
            </div>
          </div>
        )}
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
      </div>

      {showProductionSection && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '0.75rem',
              marginBottom: '0.5rem',
            }}
          >
            {/* Escape Rate */}
            <div
              style={{
                backgroundColor: 'var(--card-bg)',
                padding: '1.25rem',
                borderRadius: '12px',
                border: `2px solid ${escapeOk ? '#10B981' : '#EF4444'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                borderLeftWidth: '8px',
              }}
            >
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    margin: '0 0 0.5rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--text-color)',
                    fontSize: '1.25rem',
                  }}
                >
                  <ShieldAlert size={24} color={escapeOk ? '#10B981' : '#EF4444'} /> Taux d&apos;Échappement
                  <TrendBadge trend={getTrend(anomalies, 'escape_rate')} style={{ marginLeft: '8px' }} />
                </h3>
                <div
                  style={{
                    fontSize: '0.95rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                  }}
                >
                  <span>
                    {useBusiness ? 'Jalon' : 'Milestone'}:{' '}
                    <strong style={{ color: 'var(--text-color)' }}>{rates.prodMilestone}</strong>
                  </span>
                  <span>
                    {useBusiness ? 'Objectif' : 'Target'}:{' '}
                    <strong style={{ color: escapeOk ? '#10B981' : '#EF4444' }}>&lt; 5%</strong>
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    color: escapeOk ? '#10B981' : '#EF4444',
                    lineHeight: 1,
                  }}
                >
                  {rates.escapeRate}%
                </div>
                <div
                  style={{
                    fontSize: '1rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    marginTop: '0.25rem',
                    padding: '0.2rem 0.5rem',
                    backgroundColor: 'var(--bg-color)',
                    borderRadius: '4px',
                  }}
                >
                  {rates.bugsInProd} {useBusiness ? 'bugs prod' : 'prod bugs'}
                </div>
              </div>
            </div>

            {/* Detection Rate (DDP) */}
            <div
              style={{
                backgroundColor: 'var(--card-bg)',
                padding: '1.25rem',
                borderRadius: '12px',
                border: `2px solid ${ddpOk ? '#10B981' : '#EF4444'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                borderLeftWidth: '8px',
              }}
            >
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    margin: '0 0 0.5rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--text-color)',
                    fontSize: '1.25rem',
                  }}
                >
                  <ShieldCheck size={24} color={ddpOk ? '#10B981' : '#EF4444'} /> Taux de Détection
                  <TrendBadge trend={getTrend(anomalies, 'detection_rate')} style={{ marginLeft: '8px' }} />
                </h3>
                <div
                  style={{
                    fontSize: '0.95rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                  }}
                >
                  <span>
                    {useBusiness ? 'Lié' : 'Linked'}:{' '}
                    <strong style={{ color: 'var(--text-color)' }}>{rates.prodMilestone}</strong>
                  </span>
                  <span>
                    {useBusiness ? 'Objectif' : 'Target'}:{' '}
                    <strong style={{ color: ddpOk ? '#10B981' : '#EF4444' }}>&gt; 95%</strong>
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    color: ddpOk ? '#10B981' : '#EF4444',
                    lineHeight: 1,
                  }}
                >
                  {rates.detectionRate}%
                </div>
                <div
                  style={{
                    fontSize: '1rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    marginTop: '0.25rem',
                    padding: '0.2rem 0.5rem',
                    backgroundColor: 'var(--bg-color)',
                    borderRadius: '4px',
                  }}
                >
                  {rates.bugsInTest} {useBusiness ? 'bugs test' : 'test bugs'}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
