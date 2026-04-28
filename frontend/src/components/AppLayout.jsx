import React from 'react';
import {
  RefreshCw,
  AlertCircle,
  Activity,
  CheckCircle2,
  Database,
  Settings,
  Monitor,
  Download,
  LogIn,
  LogOut,
  User,
  FileText,
  FileSpreadsheet,
  Radio,
} from 'lucide-react';

function getDashboardRoutes(isAdmin) {
  const routes = [
    { path: '/', label: 'Dashboard 1 (Standard)' },
    { path: '/tv', label: 'Dashboard 2 (TV)' },
    { path: '/quality-rates', label: 'Dashboard 3 (Quality Rates)' },
    { path: '/global-view', label: 'Dashboard 4 (Vue Globale & PDF)' },
    { path: '/annual-trends', label: 'Dashboard 5 (Tendances Annuelles)' },
    { path: '/multi-project', label: 'Dashboard 6 (Multi-Projets)' },
    { path: '/historical-trends', label: '📈 Tendances Historiques' },
    { path: '/compare', label: '🔀 Comparateur' },
    { path: '/sync-gitlab-to-testmo', label: '⚙ Sync GitLab → Testmo' },
    { path: '/configuration', label: '⚙️ Configuration des Cycles' },
    { path: '/crosstest', label: '🔗 CrossTest OK' },
    { path: '/auto-sync', label: '🤖 Auto-Sync Testmo → GitLab' },
  ];
  if (isAdmin) {
    routes.push({ path: '/notifications', label: '🔔 Notifications' });
    routes.push({ path: '/admin/audit', label: '🛡️ Audit Logs' });
  }
  return routes;
}

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
  // Auth
  user,
  isAuthenticated,
  isAdmin,
  onLogin,
  onLogout,
  onExportPdfBackend,
  onExportCSV,
  onExportExcel,
  // Live
  liveConnected,
  liveError,
  // Resilience
  circuitBreakers,
}) {
  const dashboardRoutes = getDashboardRoutes(isAdmin);
  return (
    <div className={`app ${tvMode ? 'tv-mode' : ''} ${darkMode ? 'dark-theme' : ''}`}>
      {/* Banner mode dégradé */}
      {circuitBreakers?.some((b) => b.state === 'OPEN') && (
        <div
          style={{
            backgroundColor: '#FEF3C7',
            color: '#92400E',
            padding: '8px 16px',
            textAlign: 'center',
            fontSize: '0.875rem',
            fontWeight: 600,
            borderBottom: '1px solid #FCD34D',
          }}
          role="alert"
        >
          ⚠️ Mode dégradé — certains services externes sont temporairement indisponibles (
          {circuitBreakers
            .filter((b) => b.state === 'OPEN')
            .map((b) => b.name)
            .join(', ')}
          )
        </div>
      )}

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

          {/* Export PDF Backend */}
          {currentPath === '/global-view' && onExportPdfBackend && (
            <button
              className="btn-icon"
              style={{ backgroundColor: '#8B5CF6', color: 'white', marginRight: '8px', border: 'none' }}
              onClick={onExportPdfBackend}
              title="Exporter PDF (backend)"
              type="button"
            >
              <Download size={16} />
            </button>
          )}

          {/* Export CSV */}
          {currentPath === '/global-view' && onExportCSV && (
            <button
              className="btn-icon"
              style={{ backgroundColor: '#10B981', color: 'white', marginRight: '8px', border: 'none' }}
              onClick={onExportCSV}
              title="Exporter CSV"
              type="button"
            >
              <FileText size={16} />
            </button>
          )}

          {/* Export Excel */}
          {currentPath === '/global-view' && onExportExcel && (
            <button
              className="btn-icon"
              style={{ backgroundColor: '#3B82F6', color: 'white', marginRight: '8px', border: 'none' }}
              onClick={onExportExcel}
              title="Exporter Excel"
              type="button"
            >
              <FileSpreadsheet size={16} />
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

          {/* Indicateur Live */}
          {liveConnected && (
            <div
              className="live-indicator"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginRight: '8px',
                color: '#10B981',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
              title="Connexion temps réel active"
            >
              <Radio size={14} className="live-pulse" />
              <span>LIVE</span>
            </div>
          )}
          {liveError && !liveConnected && (
            <div
              className="live-indicator"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginRight: '8px',
                color: '#EF4444',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
              title={liveError}
            >
              <Radio size={14} />
              <span>OFFLINE</span>
            </div>
          )}

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

          {/* Auth */}
          {isAuthenticated && user ? (
            <div
              className="user-badge"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}
            >
              <User size={16} />
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-color)' }}>
                {user.name}
                {isAdmin && <span style={{ fontSize: '0.75rem', marginLeft: '4px', opacity: 0.7 }}>(Admin)</span>}
              </span>
              <button className="btn-icon" onClick={onLogout} title="Déconnexion" type="button">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              className="btn-toggle"
              onClick={onLogin}
              title="Se connecter avec GitLab"
              type="button"
              style={{ marginLeft: '8px', backgroundColor: '#FC6D26', color: '#fff', border: 'none' }}
            >
              <LogIn size={16} />
              GitLab
            </button>
          )}

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
