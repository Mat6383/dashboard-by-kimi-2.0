import React, { useRef, useMemo, useCallback } from 'react';
import { Activity, CheckSquare } from 'lucide-react';
import TestClosureModal from './TestClosureModal';
import { useExportPDF } from '../hooks/useExportPDF';
import QuickClosureModal from './QuickClosureModal';
import ReportGeneratorModal from './ReportGeneratorModal';
import PreprodSection from './PreprodSection';
import ProductionSection from './ProductionSection';

const DEFAULT_RATES = {
  escapeRate: 0,
  detectionRate: 0,
  bugsInProd: 0,
  bugsInTest: 0,
  totalBugs: 0,
  preprodMilestone: 'N/A',
  prodMilestone: 'N/A',
  message: 'Indisponible',
};

const Dashboard4 = ({
  metrics,
  project,
  projects = [],
  projectId,
  onProjectChange,
  isDark = false,
  useBusiness = true,
  setExportHandler,
  showProductionSection = true,
  onToggleProductionSection,
  anomalies = [],
}) => {
  const dashboardRef = useRef(null);
  const [showAllRuns, setShowAllRuns] = React.useState(false);
  const [showClosureModal, setShowClosureModal] = React.useState(false);
  const [showQuickClosureModal, setShowQuickClosureModal] = React.useState(false);
  const [showReportGenerator, setShowReportGenerator] = React.useState(false);
  const { exportPDF } = useExportPDF({
    orientation: 'landscape',
    backgroundColor: isDark ? '#111827' : '#F9FAFB',
  });

  const runs = useMemo(() => metrics?.runs || [], [metrics?.runs]);
  const sortedRuns = useMemo(
    () => [...runs].sort((a, b) => (a.isExploratory ? 1 : 0) - (b.isExploratory ? 1 : 0)),
    [runs]
  );
  const latestRun = useMemo(() => runs.find((r) => !r.isExploratory) || runs[0], [runs]);
  const rates = metrics?.qualityRates || DEFAULT_RATES;

  const escapeOk = rates.escapeRate < 5;
  const ddpOk = rates.detectionRate > 95;

  const getAlertForMetric = useCallback(
    (metricName) => {
      if (!metrics?.slaStatus || metrics.slaStatus.ok || !metrics.slaStatus.alerts) return null;
      return metrics.slaStatus.alerts.find((a) => a.metric === metricName);
    },
    [metrics?.slaStatus]
  );

  const handleExportPDF = useCallback(async () => {
    if (!dashboardRef.current || !project) return;
    await exportPDF(dashboardRef.current, `QA_Dashboard_${project.name}_${new Date().toLocaleDateString('fr-FR')}.pdf`);
  }, [exportPDF, project]);

  React.useEffect(() => {
    if (setExportHandler) {
      setExportHandler(() => handleExportPDF);
    }
    return () => {
      if (setExportHandler) setExportHandler(null);
    };
  }, [setExportHandler, handleExportPDF]);

  if (!metrics || !project) {
    return (
      <div className="tv-loading">
        <Activity size={48} className="spinner" />
        <h2>Chargement des données ISTQB...</h2>
      </div>
    );
  }

  const d1 = metrics;
  const raw = d1.raw || { completed: 0, total: 0, passed: 0, failed: 0, wip: 0, blocked: 0, untested: 0 };

  return (
    <div style={{ padding: '0.5rem', width: '100%', margin: '0 auto' }}>
      {projects.length > 0 && onProjectChange && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-color)' }}>Projet :</span>
          <select
            value={projectId}
            onChange={(e) => onProjectChange(parseInt(e.target.value))}
            className="project-selector"
            style={{
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-color)',
              border: '1px solid var(--border-color)',
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div
        ref={dashboardRef}
        className={`tv-dashboard ${isDark ? 'tv-dark-theme' : ''}`}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: 'var(--bg-color)',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        }}
      >
        <header style={{ display: 'none' }}>{/* Ancien header masqué */}</header>
        {(project || latestRun) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              marginBottom: '1rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.06)',
              borderRadius: '10px',
              border: '1px solid rgba(59,130,246,0.2)',
              flexWrap: 'wrap',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '1.35rem', fontWeight: 700, color: '#3B82F6' }}>{project?.name}</span>
            {latestRun && (
              <>
                <span style={{ color: 'var(--text-muted)', fontSize: '1.35rem' }}>—</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--text-color)' }}>
                  {latestRun.name}
                </span>
                <span
                  style={{
                    padding: '0.2rem 0.65rem',
                    borderRadius: '5px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    backgroundColor: 'rgba(16,185,129,0.12)',
                    color: '#10B981',
                  }}
                >
                  En cours
                </span>
              </>
            )}
          </div>
        )}

        {/* Boutons d'action */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowClosureModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.9rem',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2563EB')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3B82F6')}
          >
            <CheckSquare size={16} /> Clôture de Test
          </button>
          <button
            onClick={() => setShowQuickClosureModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#10B981',
              color: 'white',
              border: 'none',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.9rem',
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#10B981')}
          >
            <CheckSquare size={16} /> Quick Clôture DOCX
          </button>
          <button
            onClick={() => setShowReportGenerator(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#8B5CF6',
              color: 'white',
              border: 'none',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.9rem',
              boxShadow: '0 2px 4px rgba(139, 92, 246, 0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#7C3AED')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#8B5CF6')}
          >
            <CheckSquare size={16} /> Rapport HTML / PPTX
          </button>
        </div>

        <PreprodSection
          metrics={metrics}
          raw={raw}
          sortedRuns={sortedRuns}
          showAllRuns={showAllRuns}
          setShowAllRuns={setShowAllRuns}
          isDark={isDark}
          useBusiness={useBusiness}
          getAlertForMetric={getAlertForMetric}
          anomalies={anomalies}
        />

        <ProductionSection
          rates={rates}
          escapeOk={escapeOk}
          ddpOk={ddpOk}
          showProductionSection={showProductionSection}
          onToggleProductionSection={onToggleProductionSection}
          isDark={isDark}
          useBusiness={useBusiness}
          anomalies={anomalies}
        />
      </div>

      <TestClosureModal
        isOpen={showClosureModal}
        onClose={() => setShowClosureModal(false)}
        metrics={metrics}
        project={project}
        useBusiness={useBusiness}
        isDark={isDark}
      />

      <QuickClosureModal
        isOpen={showQuickClosureModal}
        onClose={() => setShowQuickClosureModal(false)}
        metrics={metrics}
        project={project}
        useBusiness={useBusiness}
        isDark={isDark}
      />

      <ReportGeneratorModal
        isOpen={showReportGenerator}
        onClose={() => setShowReportGenerator(false)}
        metrics={metrics}
        project={project}
        isDark={isDark}
      />
    </div>
  );
};

export default Dashboard4;
