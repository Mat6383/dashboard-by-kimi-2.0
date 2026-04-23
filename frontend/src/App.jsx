/**
 * ================================================
 * TESTMO DASHBOARD - Main Application
 * ================================================
 * Dashboard principal de monitoring des tests
 *
 * Standards:
 * - ISTQB: Test Monitoring & Control
 * - LEAN: Auto-refresh 1m
 * - ITIL: Service Level Management
 *
 * @author Matou - Neo-Logix QA Lead
 * @version 2.0.0
 */

import React, { useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import { usePreferences } from './hooks/usePreferences';
import { useDashboard } from './hooks/useDashboard';
import { useToast } from './hooks/useToast';

import MetricsCards from './components/MetricsCards';
import StatusChart from './components/StatusChart';
import RunsList from './components/RunsList';
import ConfigurationScreen from './components/ConfigurationScreen';
import { RefreshCw, AlertCircle, Activity, CheckCircle2, Database, Settings, Monitor, Download } from 'lucide-react';
import './styles/App.css';

const REFRESH_COOLDOWN = 5000;

// Lazy loading des dashboards administratifs et secondaires
const TvModeDashboard = lazy(() => import('./components/TvModeDashboard'));
const QualityRatesDashboard = lazy(() => import('./components/QualityRatesDashboard'));
const GlobalViewDashboard = lazy(() => import('./components/GlobalViewDashboard'));
const AnnualTrendsDashboard = lazy(() => import('./components/AnnualTrendsDashboard'));
const GitLabToTestmoSync = lazy(() => import('./components/GitLabToTestmoSync'));
const CrossTestDashboard = lazy(() => import('./components/CrossTestDashboard'));
const AutoSyncDashboard = lazy(() => import('./components/AutoSyncDashboard'));

const dashboardRoutes = [
  { path: '/', label: 'Dashboard 1 (Standard)' },
  { path: '/tv', label: 'Dashboard 2 (TV)' },
  { path: '/quality-rates', label: 'Dashboard 3 (Quality Rates)' },
  { path: '/global-view', label: 'Dashboard 4 (Vue Globale & PDF)' },
  { path: '/annual-trends', label: 'Dashboard 5 (Tendances Annuelles)' },
  { path: '/sync-gitlab-to-testmo', label: '⚙ Sync GitLab → Testmo' },
  { path: '/configuration', label: '⚙️ Configuration des Cycles' },
  { path: '/crosstest', label: '🔗 CrossTest OK' },
  { path: '/auto-sync', label: '🤖 Auto-Sync Testmo → GitLab' },
];

function App() {
  const { darkMode, tvMode, toggleDarkMode, toggleTvMode } = useTheme();
  const { useBusinessTerms, setUseBusinessTerms, autoRefresh, setAutoRefresh } = usePreferences();
  const {
    projectId,
    setProjectId,
    projects,
    metrics,
    loading,
    error,
    lastUpdate,
    backendStatus,
    exportHandler,
    setExportHandler,
    selectedPreprodMilestones,
    setSelectedPreprodMilestones,
    selectedProdMilestones,
    setSelectedProdMilestones,
    showProductionSection,
    setShowProductionSection,
    checkBackendHealth,
    loadProjects,
    loadDashboardMetrics,
    handleClearCache,
    isLoadingRef,
    lastRefreshRef,
  } = useDashboard();
  const navigate = useNavigate();
  const location = useLocation();

  const currentProject = useMemo(() => projects.find((p) => p.id === projectId), [projects, projectId]);

  const handleSaveSelection = useCallback(
    (preprodMilestones, prodMilestones) => {
      setSelectedPreprodMilestones(preprodMilestones || []);
      setSelectedProdMilestones(prodMilestones || []);
      navigate('/');
    },
    [navigate, setSelectedPreprodMilestones, setSelectedProdMilestones]
  );

  // Effet initial: vérifier backend et charger données
  useEffect(() => {
    checkBackendHealth();
    loadProjects();
    loadDashboardMetrics(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recharger quand le projet ou les milestones changent
  useEffect(() => {
    loadDashboardMetrics(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, selectedPreprodMilestones, selectedProdMilestones]);

  // Effet: Auto-refresh toutes les minutes (LEAN)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      console.log('[Auto-refresh] Rechargement des métriques (1m)...');
      loadDashboardMetrics();
    }, 60000);

    return () => clearInterval(interval);
  }, [autoRefresh, loadDashboardMetrics]);

  // Effet: Rafraichissement forcé au retour sur la page
  useEffect(() => {
    if (!autoRefresh) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (isLoadingRef.current) return;
        const now = Date.now();
        if (now - lastRefreshRef.current < REFRESH_COOLDOWN) return;
        console.log('[Auto-refresh] Retour focus/visibilité - Rechargement des métriques');
        lastRefreshRef.current = now;
        loadDashboardMetrics();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('resize', handleVisibilityChange);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('resize', handleVisibilityChange);
    };
  }, [autoRefresh, loadDashboardMetrics, isLoadingRef, lastRefreshRef]);

  const handleProjectChange = (event) => {
    const newProjectId = parseInt(event.target.value);
    setProjectId(newProjectId);
  };

  const handleDashboardChange = (event) => {
    navigate(event.target.value);
  };

  const renderBackendStatus = () => {
    const statusConfig = {
      checking: { icon: Activity, color: '#F59E0B', text: 'Connexion...' },
      ok: { icon: CheckCircle2, color: '#10B981', text: 'Backend OK' },
      error: { icon: AlertCircle, color: '#EF4444', text: 'Backend Error' },
    };

    const config = statusConfig[backendStatus];
    const Icon = config.icon;

    return (
      <div className="backend-status" style={{ color: config.color }}>
        <Icon size={16} />
        <span>{config.text}</span>
      </div>
    );
  };

  if (error && !metrics) {
    return (
      <div className="app-error">
        <AlertCircle size={48} color="#EF4444" />
        <h2>Erreur de Chargement</h2>
        <p>{error}</p>
        <button onClick={() => loadDashboardMetrics()} className="btn-retry">
          <RefreshCw size={16} />
          Réessayer
        </button>
      </div>
    );
  }

  const currentPath = location.pathname;

  return (
    <div className={`app ${tvMode ? 'tv-mode' : ''} ${darkMode ? 'dark-theme' : ''}`}>
      {/* Header */}
      <header className="app-header" role="banner">
        <div className="header-left">
          <Database size={32} color="#3B82F6" />
          <div className="header-title">
            <h1>Testmo Dashboard</h1>
            <p className="header-subtitle">ISTQB Compliant | LEAN Optimized | ITIL SLA Monitoring</p>
          </div>
        </div>

        <div className="header-right">
          {/* Sélecteur de projet */}
          {projects.length > 0 && (
            <select
              value={projectId}
              onChange={handleProjectChange}
              className="project-selector"
              aria-label="Sélectionner un projet"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          )}

          {/* Toggle TV Mode */}
          <button className={`btn-toggle ${tvMode ? 'active' : ''}`} onClick={() => toggleTvMode()} title="Mode TV">
            <Monitor size={16} />
            {tvMode ? 'Mode TV' : 'Mode Standard'}
          </button>

          {/* Toggle Dark Theme Switch */}
          <div
            className="switch-container"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px', marginRight: '8px' }}
          >
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-color)' }}>Dark thème</span>
            <label className="theme-switch" aria-label="Activer le thème sombre">
              <input type="checkbox" checked={darkMode} onChange={() => toggleDarkMode()} aria-label="Thème sombre" />
              <span className="slider round"></span>
            </label>
          </div>

          {/* Sélecteur de Dashboard */}
          <div style={{ marginLeft: '8px', marginRight: '8px' }}>
            <select
              value={currentPath}
              onChange={handleDashboardChange}
              className="project-selector"
              style={{
                backgroundColor: 'var(--card-bg)',
                color: 'var(--text-color)',
                border: '1px solid var(--border-color)',
              }}
              aria-label="Sélectionner un dashboard"
            >
              {dashboardRoutes.map((route) => (
                <option key={route.path} value={route.path}>
                  {route.label}
                </option>
              ))}
            </select>
          </div>

          {/* Export PDF Dashboard 4 */}
          {currentPath === '/global-view' && exportHandler && (
            <button
              className="btn-icon"
              style={{ backgroundColor: '#3B82F6', color: 'white', marginRight: '8px', border: 'none' }}
              onClick={() => exportHandler()}
              title="Exporter en PDF"
            >
              <Download size={16} />
            </button>
          )}

          {/* Toggle Vocabulaire Métier Switch */}
          <div
            className="switch-container"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px', marginRight: '8px' }}
          >
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-color)' }}>
              Vocabulaire Métier
            </span>
            <label className="theme-switch" aria-label="Activer le vocabulaire métier">
              <input
                type="checkbox"
                checked={useBusinessTerms}
                onChange={() => setUseBusinessTerms(!useBusinessTerms)}
                aria-label="Vocabulaire métier"
              />
              <span className="slider round"></span>
            </label>
          </div>

          {/* Toggle auto-refresh */}
          <button
            className={`btn-toggle ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
            title="Auto-refresh 1m"
          >
            <RefreshCw size={16} className={autoRefresh ? 'spinning' : ''} />
            {autoRefresh ? 'Auto ON' : 'Auto OFF'}
          </button>

          {/* Refresh manuel */}
          <button className="btn-icon" onClick={() => loadDashboardMetrics()} disabled={loading} title="Actualiser">
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          </button>

          {/* Clear cache */}
          <button className="btn-icon" onClick={handleClearCache} title="Nettoyer le cache">
            <Settings size={16} />
          </button>

          {/* Statut backend */}
          {renderBackendStatus()}
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main" role="main">
        {loading && !metrics ? (
          <div className="loading-container">
            <RefreshCw size={48} className="spinner" />
            <p>Chargement des métriques ISTQB...</p>
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="loading-container">
                <RefreshCw size={48} className="spinner" />
                <p>Chargement du dashboard...</p>
              </div>
            }
          >
            <Routes>
              <Route
                path="/tv"
                element={
                  <TvModeDashboard
                    metrics={metrics}
                    project={currentProject}
                    isDark={darkMode}
                    useBusiness={useBusinessTerms}
                  />
                }
              />
              <Route
                path="/quality-rates"
                element={
                  <QualityRatesDashboard
                    metrics={metrics}
                    project={currentProject}
                    isDark={darkMode}
                    useBusiness={useBusinessTerms}
                  />
                }
              />
              <Route
                path="/global-view"
                element={
                  <GlobalViewDashboard
                    metrics={metrics}
                    project={currentProject}
                    projects={projects}
                    projectId={projectId}
                    onProjectChange={setProjectId}
                    isDark={darkMode}
                    useBusiness={useBusinessTerms}
                    setExportHandler={setExportHandler}
                    showProductionSection={showProductionSection}
                    onToggleProductionSection={setShowProductionSection}
                  />
                }
              />
              <Route
                path="/annual-trends"
                element={
                  <AnnualTrendsDashboard projectId={projectId} isDark={darkMode} useBusiness={useBusinessTerms} />
                }
              />
              <Route path="/sync-gitlab-to-testmo" element={<GitLabToTestmoSync isDark={darkMode} />} />
              <Route path="/crosstest" element={<CrossTestDashboard isDark={darkMode} />} />
              <Route path="/auto-sync" element={<AutoSyncDashboard isDark={darkMode} />} />
              <Route
                path="/configuration"
                element={
                  <ConfigurationScreen
                    projectId={projectId}
                    isDark={darkMode}
                    initialPreprodMilestones={selectedPreprodMilestones}
                    initialProdMilestones={selectedProdMilestones}
                    onSaveSelection={handleSaveSelection}
                  />
                }
              />
              <Route
                path="/"
                element={
                  <>
                    <section className="section">
                      <MetricsCards metrics={metrics} useBusiness={useBusinessTerms} />
                    </section>
                    <section className="section charts-section">
                      <div className="chart-container">
                        <StatusChart
                          metrics={metrics}
                          chartType="doughnut"
                          useBusiness={useBusinessTerms}
                          isDark={darkMode}
                        />
                      </div>
                      <div className="chart-container">
                        <StatusChart
                          metrics={metrics}
                          chartType="bar"
                          useBusiness={useBusinessTerms}
                          isDark={darkMode}
                        />
                      </div>
                    </section>
                    <section className="section">
                      <RunsList metrics={metrics} useBusiness={useBusinessTerms} />
                    </section>
                  </>
                }
              />
            </Routes>
          </Suspense>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer" role="contentinfo">
        <div className="footer-content">
          <span>© 2026 Neo-Logix | QA Dashboard by Matou</span>
          {lastUpdate && (
            <span className="last-update">Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}</span>
          )}
          <span>Standards: ISTQB | LEAN | ITIL</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
