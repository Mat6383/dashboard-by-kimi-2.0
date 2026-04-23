import React from 'react';
import { RefreshCw, AlertCircle, Activity, CheckCircle2, Database, Settings, Monitor, Download } from 'lucide-react';

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

function BackendStatus({ status }) {
  const config = {
    checking: { Icon: Activity, color: '#F59E0B', text: 'Connexion...' },
    ok: { Icon: CheckCircle2, color: '#10B981', text: 'Backend OK' },
    error: { Icon: AlertCircle, color: '#EF4444', text: 'Backend Error' },
  };
  const { Icon, color, text } = config[status] || config.checking;

  return (
    <div className="backend-status" style={{ color }}>
      <Icon size={16} />
      <span>{text}</span>
    </div>
  );
}

export default function AppLayout({
  children,
  // Theme & prefs
  darkMode,
  tvMode,
  toggleDarkMode,
  toggleTvMode,
  useBusinessTerms,
  setUseBusinessTerms,
  autoRefresh,
  setAutoRefresh,
  // Data & actions
  projectId,
  projects,
  onProjectChange,
  onDashboardChange,
  onRefresh,
  onClearCache,
  loading,
  backendStatus,
  lastUpdate,
  // Routing
  currentPath,
  // Export
  exportHandler,
}) {
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
              onChange={onProjectChange}
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
          <button
            className={`btn-toggle ${tvMode ? 'active' : ''}`}
            onClick={toggleTvMode}
            title="Mode TV"
            type="button"
          >
            <Monitor size={16} />
            {tvMode ? 'Mode TV' : 'Mode Standard'}
          </button>

          {/* Toggle Dark Theme */}
          <div
            className="switch-container"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px', marginRight: '8px' }}
          >
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-color)' }}>Dark thème</span>
            <label className="theme-switch" aria-label="Activer le thème sombre">
              <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} aria-label="Thème sombre" />
              <span className="slider round" />
            </label>
          </div>

          {/* Sélecteur de Dashboard */}
          <div style={{ marginLeft: '8px', marginRight: '8px' }}>
            <select
              value={currentPath}
              onChange={onDashboardChange}
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
              onClick={exportHandler}
              title="Exporter en PDF"
              type="button"
            >
              <Download size={16} />
            </button>
          )}

          {/* Toggle Vocabulaire Métier */}
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
              <span className="slider round" />
            </label>
          </div>

          {/* Toggle auto-refresh */}
          <button
            className={`btn-toggle ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
            title="Auto-refresh 1m"
            type="button"
          >
            <RefreshCw size={16} className={autoRefresh ? 'spinning' : ''} />
            {autoRefresh ? 'Auto ON' : 'Auto OFF'}
          </button>

          {/* Refresh manuel */}
          <button className="btn-icon" onClick={onRefresh} disabled={loading} title="Actualiser" type="button">
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          </button>

          {/* Clear cache */}
          <button className="btn-icon" onClick={onClearCache} title="Nettoyer le cache" type="button">
            <Settings size={16} />
          </button>

          {/* Statut backend */}
          <BackendStatus status={backendStatus} />
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main" role="main">
        {children}
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
