/**
 * ================================================
 * PREPROD SECTION — Dashboard4 Préproduction
 * ================================================
 * Grille de métriques, répartition des statuts, campagnes actives.
 *
 * @author Matou - Neo-Logix QA Lead
 * @version 1.0.0
 */

import React from 'react';
import { Activity, CheckSquare, XCircle, TrendingUp, BarChart3, Database, Search } from 'lucide-react';
import MetricCard from './MetricCard';

export function getPassRateColor(passRate) {
  if (passRate >= 95) return '#10B981';
  if (passRate >= 90) return '#F59E0B';
  return '#EF4444';
}

function getTrend(anomalies, metricKey) {
  return anomalies?.find((a) => a.metric === metricKey) || null;
}

export default function PreprodSection({
  metrics,
  raw,
  sortedRuns,
  showAllRuns,
  setShowAllRuns,
  isDark,
  useBusiness,
  getAlertForMetric,
  anomalies,
}) {
  const d1 = metrics;

  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', color: 'var(--text-color)', margin: 0 }}>
          {useBusiness ? 'PRÉPRODUCTION' : 'PREPROD'}
        </h2>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
      </div>

      {/* Grille principale Preprod */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        <MetricCard
          title={useBusiness ? "Taux d'Exécution" : 'Execution Rate'}
          icon={Activity}
          value={d1.completionRate}
          color={d1.completionRate >= 90 ? '#10B981' : d1.completionRate >= 80 ? '#F59E0B' : '#EF4444'}
          arrow={d1.completionRate >= 90 ? '▲' : '▼'}
          badge={`${raw.completed} / ${raw.total}`}
          label={useBusiness ? 'tests exécutés (Cible: ≥ 90%)' : 'tests executed (Target: ≥ 90%)'}
          alert={getAlertForMetric('Completion Rate')}
          useBusiness={useBusiness}
          trend={getTrend(anomalies, 'completion_rate')}
        />
        <MetricCard
          title={useBusiness ? 'Taux de Succès' : 'Pass Rate'}
          icon={CheckSquare}
          value={d1.passRate}
          color={d1.passRate >= 95 ? '#10B981' : d1.passRate >= 90 ? '#F59E0B' : '#EF4444'}
          arrow={d1.passRate >= 95 ? '▲' : '▼'}
          badge={raw.passed}
          label={useBusiness ? 'tests réussis (Cible: ≥ 95%)' : 'tests passed (Target: ≥ 95%)'}
          description={
            useBusiness
              ? '(Réussis / Total des tests terminés, bloqués ou ignorés)'
              : '(Passed / Total completed, blocked or skipped)'
          }
          alert={getAlertForMetric('Pass Rate') || getAlertForMetric('Blocked Rate')}
          useBusiness={useBusiness}
          trend={getTrend(anomalies, 'pass_rate')}
        />
        <MetricCard
          title={useBusiness ? "Taux d'Échec" : 'Failure Rate'}
          icon={XCircle}
          value={d1.failureRate}
          color={d1.failureRate <= 5 ? '#10B981' : d1.failureRate <= 10 ? '#F59E0B' : '#EF4444'}
          arrow={d1.failureRate <= 5 ? '▼' : '▲'}
          badge={raw.failed}
          label={useBusiness ? 'tests échoués (Cible: ≤ 5%)' : 'tests failed (Target: ≤ 5%)'}
          alert={getAlertForMetric('Failure Rate')}
          useBusiness={useBusiness}
        />
        <MetricCard
          title={useBusiness ? 'Efficience des tests' : 'Test Efficiency'}
          icon={TrendingUp}
          value={d1.testEfficiency}
          color={d1.testEfficiency >= 95 ? '#10B981' : d1.testEfficiency >= 90 ? '#F59E0B' : '#EF4444'}
          arrow={d1.testEfficiency >= 95 ? '▲' : '▼'}
          badge={useBusiness ? 'Objectif' : 'Target'}
          label={useBusiness ? 'Approcher les 100% (≥ 95%)' : 'Approach 100% (≥ 95%)'}
          description={useBusiness ? '(Réussis / (Réussis + Échoués) purs)' : '(Passed / (Passed + Failed))'}
          alert={getAlertForMetric('Test Efficiency')}
          useBusiness={useBusiness}
        />
      </div>

      {/* Répartition des statuts */}
      <div
        style={{
          backgroundColor: 'var(--card-bg)',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-color)',
            fontWeight: 600,
            fontSize: '1.3rem',
            marginRight: '1rem',
          }}
        >
          <BarChart3 size={24} /> Répartition Globale
        </div>
        {[
          { label: useBusiness ? 'Réussis' : 'Passed', val: raw.passed, color: '#10B981' },
          { label: useBusiness ? 'Échoués' : 'Failed', val: raw.failed, color: '#EF4444' },
          { label: useBusiness ? 'En cours' : 'WIP', val: raw.wip, color: '#3B82F6' },
          { label: useBusiness ? 'Bloqués' : 'Blocked', val: raw.blocked, color: '#F59E0B' },
          { label: useBusiness ? 'Non testés' : 'Untested', val: raw.untested, color: '#9CA3AF' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--bg-color)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: stat.color }}></div>
            <span style={{ fontSize: '1.1rem', color: 'var(--text-color)' }}>{stat.label}:</span>
            <span style={{ fontWeight: 800, fontSize: '1.35rem', color: 'var(--text-color)' }}>{stat.val}</span>
          </div>
        ))}
      </div>

      {/* Campagnes Actives */}
      <div
        style={{
          backgroundColor: 'var(--card-bg)',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          marginBottom: '1rem',
        }}
      >
        <h3
          style={{
            margin: '0 0 1rem 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'var(--text-color)',
            fontSize: '1.35rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={24} color="var(--color-primary)" /> Campagnes Actives (Préproduction)
          </div>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setShowAllRuns(!showAllRuns)}
            role="switch"
            aria-checked={showAllRuns}
            tabIndex={0}
          >
            <span
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: showAllRuns ? 'var(--color-primary)' : 'var(--text-muted)',
                transition: 'color 0.3s',
              }}
            >
              {useBusiness ? 'Tout afficher' : 'Show All'}
            </span>
            <div
              style={{
                width: '48px',
                height: '24px',
                backgroundColor: showAllRuns ? '#10B981' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                borderRadius: '12px',
                position: 'relative',
                transition: 'background-color 0.3s ease',
                border: showAllRuns ? '1px solid #059669' : '1px solid var(--border-color)',
                boxShadow: showAllRuns ? '0 0 10px rgba(16, 185, 129, 0.3)' : 'inset 0 2px 4px rgba(0,0,0,0.05)',
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2px',
                  left: showAllRuns ? '26px' : '2px',
                  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showAllRuns && (
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                )}
              </div>
            </div>
          </div>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {sortedRuns.slice(0, showAllRuns ? sortedRuns.length : sortedRuns.length <= 12 ? 12 : 8).map((run) => (
            <div
              key={run.id}
              title={
                run.isExploratory
                  ? `${useBusiness ? 'Session' : 'Session'} #${run.id.replace('session-', '')}: ${run.name}`
                  : run.name
              }
              style={{
                padding: '1rem',
                backgroundColor: run.isExploratory
                  ? isDark
                    ? 'rgba(139, 92, 246, 0.15)'
                    : 'rgba(139, 92, 246, 0.05)'
                  : 'var(--bg-color)',
                borderRadius: '8px',
                border: run.isExploratory
                  ? `1px solid ${isDark ? '#8B5CF6' : '#C4B5FD'}`
                  : '1px solid var(--border-color)',
                borderLeft: run.isExploratory ? `5px solid #8B5CF6` : `1px solid var(--border-color)`,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                position: 'relative',
                boxShadow: run.isExploratory ? '0 4px 12px rgba(139, 92, 246, 0.1)' : 'none',
                transition: 'all 0.2s ease',
                cursor: run.isExploratory ? 'help' : 'default',
                transform: 'scale(1)',
              }}
              onMouseEnter={run.isExploratory ? (e) => (e.currentTarget.style.transform = 'scale(1.02)') : undefined}
              onMouseLeave={run.isExploratory ? (e) => (e.currentTarget.style.transform = 'scale(1)') : undefined}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                }}
              >
                <div
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: 'var(--text-color)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flex: 1,
                  }}
                >
                  {run.name}
                </div>
                {run.isExploratory ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.2rem 0.5rem',
                      backgroundColor: '#8B5CF6',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                    }}
                  >
                    <Search size={12} />
                    <span>{useBusiness ? 'Explo' : 'Explo'}</span>
                  </div>
                ) : (
                  <Database size={16} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                )}
              </div>

              {run.isExploratory && (
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: run.isClosed ? 'var(--text-muted)' : '#10B981',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: run.isClosed ? '#9CA3AF' : '#10B981',
                    }}
                  ></div>
                  {run.isClosed
                    ? useBusiness
                      ? 'Session terminée'
                      : 'Closed'
                    : useBusiness
                      ? 'Session en cours'
                      : 'Active'}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.95rem',
                  marginTop: run.isExploratory ? '0' : '0.4rem',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Progression</span>
                <span style={{ fontWeight: 700, color: 'var(--text-color)' }}>{run.completionRate}%</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: 'var(--border-color)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${run.completionRate}%`,
                    height: '100%',
                    backgroundColor: run.isExploratory
                      ? '#8B5CF6'
                      : run.completionRate >= 90
                        ? '#10B981'
                        : run.completionRate >= 80
                          ? '#F59E0B'
                          : '#3B82F6',
                  }}
                ></div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.95rem',
                  marginTop: '0.2rem',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>{useBusiness ? 'Taux de succès' : 'Pass Rate'}</span>
                <span style={{ fontWeight: 700, color: getPassRateColor(run.passRate) }}>{run.passRate}%</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: 'var(--border-color)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${run.passRate}%`,
                    height: '100%',
                    backgroundColor: getPassRateColor(run.passRate),
                  }}
                ></div>
              </div>
            </div>
          ))}
          {sortedRuns.length > 12 && !showAllRuns && (
            <div
              style={{
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                fontSize: '1.1rem',
                fontStyle: 'italic',
                border: '1px dashed var(--border-color)',
                borderRadius: '8px',
              }}
            >
              + {sortedRuns.length - 8} {useBusiness ? 'autres campagnes...' : 'other campaigns...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
