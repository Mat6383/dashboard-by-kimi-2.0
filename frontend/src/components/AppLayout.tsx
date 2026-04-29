import React from 'react';
import { useTranslation } from 'react-i18next';
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
  Globe,
  LayoutTemplate,
  Menu,
} from 'lucide-react';
import { useGlobalShortcuts } from '../hooks/useGlobalShortcuts';
import { useIsMobile } from '../hooks/useMediaQuery';
import MobileDrawer from './MobileDrawer';
import MobileBottomNav from './MobileBottomNav';
import ShortcutHelpOverlay from './ShortcutHelpOverlay';

function getDashboardRoutes(isAdmin, t) {
  const routes = [
    { path: '/', label: t('dashboard.standard') },
    { path: '/tv', label: t('dashboard.tv') },
    { path: '/quality-rates', label: t('dashboard.qualityRates') },
    { path: '/global-view', label: t('dashboard.globalView') },
    { path: '/annual-trends', label: t('dashboard.annualTrends') },
    { path: '/multi-project', label: t('dashboard.multiProject') },
    { path: '/historical-trends', label: t('dashboard.historicalTrends') },
    { path: '/compare', label: t('dashboard.compare') },
    { path: '/sync-gitlab-to-testmo', label: t('dashboard.syncGitlabToTestmo') },
    { path: '/configuration', label: t('dashboard.configuration') },
    { path: '/crosstest', label: t('dashboard.crosstest') },
    { path: '/auto-sync', label: t('dashboard.autoSync') },
  ];
  if (isAdmin) {
    routes.push({ path: '/notifications', label: t('dashboard.notifications') });
    routes.push({ path: '/admin/audit', label: t('dashboard.auditLogs') });
    routes.push({ path: '/admin/feature-flags', label: t('dashboard.featureFlags') });
  }
  return routes;
}

function BackendStatus({ status, t }) {
  const config = {
    checking: { Icon: Activity, color: '#F59E0B', text: t('layout.backendStatus.checking') },
    ok: { Icon: CheckCircle2, color: '#10B981', text: t('layout.backendStatus.ok') },
    error: { Icon: AlertCircle, color: '#EF4444', text: t('layout.backendStatus.error') },
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
  // Compact mode
  compactMode,
  toggleCompactMode,
}) {
  const { t, i18n } = useTranslation();
  const dashboardRoutes = getDashboardRoutes(isAdmin, t);
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const [showHelp, setShowHelp] = React.useState(false);
  useGlobalShortcuts({ onHelp: () => setShowHelp((prev) => !prev) });
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
          ⚠️ {t('layout.degradedMode')} (
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
            <h1>{t('layout.title')}</h1>
            {!isMobile && <p className="header-subtitle">{t('layout.subtitle')}</p>}
          </div>
        </div>

        {isMobile ? (
          <div className="header-right">
            {projects.length > 0 && (
              <select
                value={projectId}
                onChange={onProjectChange}
                className="project-selector"
                aria-label={t('layout.selectProject')}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            )}
            <button
              className="btn-icon"
              onClick={() => setDrawerOpen(true)}
              aria-label={t('layout.menu')}
              type="button"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <Menu size={20} />
            </button>
          </div>
        ) : (
          <div className="header-right">
          {/* Sélecteur de projet */}
          {projects.length > 0 && (
            <select
              value={projectId}
              onChange={onProjectChange}
              className="project-selector"
              aria-label={t('layout.selectProject')}
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
            title={tvMode ? t('layout.tvModeOn') : t('layout.tvModeOff')}
            type="button"
          >
            <Monitor size={16} />
            {tvMode ? t('layout.tvModeOn') : t('layout.tvModeOff')}
          </button>

          {/* Toggle Compact Mode */}
          <button
            className={`btn-toggle ${compactMode ? 'active' : ''}`}
            onClick={toggleCompactMode}
            title={compactMode ? t('layout.compactModeOn') : t('layout.compactModeOff')}
            type="button"
            data-testid="compact-mode-toggle"
          >
            <LayoutTemplate size={16} />
            {compactMode ? t('layout.compactModeOn') : t('layout.compactModeOff')}
          </button>

          {/* Toggle Dark Theme */}
          <div
            className="switch-container"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px', marginRight: '8px' }}
          >
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-color)' }}>{t('layout.darkTheme')}</span>
            <label className="theme-switch" aria-label={t('layout.darkTheme')}>
              <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} aria-label={t('layout.darkTheme')} />
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
              aria-label={t('layout.selectDashboard')}
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
              title={t('layout.exportPdf')}
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
              title={t('layout.exportPdfBackend')}
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
              title={t('layout.exportCsv')}
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
              title={t('layout.exportExcel')}
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
              {t('layout.businessTerms')}
            </span>
            <label className="theme-switch" aria-label={t('layout.businessTerms')}>
              <input
                type="checkbox"
                checked={useBusinessTerms}
                onChange={() => setUseBusinessTerms(!useBusinessTerms)}
                aria-label={t('layout.businessTerms')}
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
              title={t('layout.liveIndicator')}
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
              title={liveError || t('layout.offlineIndicator')}
            >
              <Radio size={14} />
              <span>OFFLINE</span>
            </div>
          )}

          {/* Sélecteur de langue */}
          <button
            className="btn-toggle"
            onClick={() => changeLanguage(i18n.language === 'fr' ? 'en' : 'fr')}
            title={t('common.language')}
            type="button"
            style={{ marginLeft: '8px', marginRight: '8px' }}
          >
            <Globe size={16} />
            {i18n.language === 'fr' ? 'FR' : 'EN'}
          </button>

          {/* Toggle auto-refresh */}
          <button
            className={`btn-toggle ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
            title="Auto-refresh 1m"
            type="button"
          >
            <RefreshCw size={16} className={autoRefresh ? 'spinning' : ''} />
            {autoRefresh ? t('layout.autoRefreshOn') : t('layout.autoRefreshOff')}
          </button>

          {/* Refresh manuel */}
          <button className="btn-icon" onClick={onRefresh} disabled={loading} title={t('common.refresh')} type="button">
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          </button>

          {/* Clear cache */}
          <button className="btn-icon" onClick={onClearCache} title={t('layout.clearCache')} type="button">
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
                {isAdmin && <span style={{ fontSize: '0.75rem', marginLeft: '4px', opacity: 0.7 }}>{t('layout.adminBadge')}</span>}
              </span>
              <button className="btn-icon" onClick={onLogout} title={t('layout.logout')} type="button">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              className="btn-toggle"
              onClick={onLogin}
              title={t('auth.login')}
              type="button"
              style={{ marginLeft: '8px', backgroundColor: '#FC6D26', color: '#fff', border: 'none' }}
            >
              <LogIn size={16} />
              {t('layout.loginGitLab')}
            </button>
          )}

          {/* Statut backend */}
          <BackendStatus status={backendStatus} t={t} />
        </div>
      )}
      </header>

      {isMobile && (
        <MobileDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={t('layout.settings')}
        >
          <div className="mobile-drawer-controls">
            {/* Toggle TV Mode */}
            <button
              className={`btn-toggle ${tvMode ? 'active' : ''}`}
              onClick={toggleTvMode}
              type="button"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Monitor size={16} />
              {tvMode ? t('layout.tvModeOn') : t('layout.tvModeOff')}
            </button>

            {/* Toggle Compact Mode */}
            <button
              className={`btn-toggle ${compactMode ? 'active' : ''}`}
              onClick={toggleCompactMode}
              type="button"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <LayoutTemplate size={16} />
              {compactMode ? t('layout.compactModeOn') : t('layout.compactModeOff')}
            </button>

            {/* Toggle Dark Theme */}
            <div className="switch-container" style={{ justifyContent: 'space-between', padding: '12px 0' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{t('layout.darkTheme')}</span>
              <label className="theme-switch" aria-label={t('layout.darkTheme')}>
                <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
                <span className="slider round" />
              </label>
            </div>

            {/* Sélecteur Dashboard */}
            <select
              value={currentPath}
              onChange={onDashboardChange}
              className="project-selector"
              style={{ width: '100%' }}
              aria-label={t('layout.selectDashboard')}
            >
              {dashboardRoutes.map((route) => (
                <option key={route.path} value={route.path}>
                  {route.label}
                </option>
              ))}
            </select>

            {/* Exports */}
            {currentPath === '/global-view' && exportHandler && (
              <button className="btn-icon" style={{ width: '100%', justifyContent: 'center' }} onClick={exportHandler} type="button">
                <Download size={16} /> {t('layout.exportPdf')}
              </button>
            )}
            {currentPath === '/global-view' && onExportPdfBackend && (
              <button className="btn-icon" style={{ width: '100%', justifyContent: 'center', backgroundColor: '#8B5CF6', color: 'white' }} onClick={onExportPdfBackend} type="button">
                <Download size={16} /> {t('layout.exportPdfBackend')}
              </button>
            )}
            {currentPath === '/global-view' && onExportCSV && (
              <button className="btn-icon" style={{ width: '100%', justifyContent: 'center', backgroundColor: '#10B981', color: 'white' }} onClick={onExportCSV} type="button">
                <FileText size={16} /> {t('layout.exportCsv')}
              </button>
            )}
            {currentPath === '/global-view' && onExportExcel && (
              <button className="btn-icon" style={{ width: '100%', justifyContent: 'center', backgroundColor: '#3B82F6', color: 'white' }} onClick={onExportExcel} type="button">
                <FileSpreadsheet size={16} /> {t('layout.exportExcel')}
              </button>
            )}

            {/* Toggle Vocabulaire Métier */}
            <div className="switch-container" style={{ justifyContent: 'space-between', padding: '12px 0' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{t('layout.businessTerms')}</span>
              <label className="theme-switch" aria-label={t('layout.businessTerms')}>
                <input type="checkbox" checked={useBusinessTerms} onChange={() => setUseBusinessTerms(!useBusinessTerms)} />
                <span className="slider round" />
              </label>
            </div>

            {/* Langue */}
            <button className="btn-toggle" onClick={() => changeLanguage(i18n.language === 'fr' ? 'en' : 'fr')} type="button" style={{ width: '100%', justifyContent: 'center' }}>
              <Globe size={16} />
              {i18n.language === 'fr' ? 'FR' : 'EN'}
            </button>

            {/* Auto-refresh */}
            <button className={`btn-toggle ${autoRefresh ? 'active' : ''}`} onClick={() => setAutoRefresh(!autoRefresh)} type="button" style={{ width: '100%', justifyContent: 'center' }}>
              <RefreshCw size={16} className={autoRefresh ? 'spinning' : ''} />
              {autoRefresh ? t('layout.autoRefreshOn') : t('layout.autoRefreshOff')}
            </button>

            {/* Refresh + Clear Cache */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-icon" onClick={onRefresh} disabled={loading} type="button" style={{ flex: 1, justifyContent: 'center' }}>
                <RefreshCw size={16} className={loading ? 'spinning' : ''} />
              </button>
              <button className="btn-icon" onClick={onClearCache} type="button" style={{ flex: 1, justifyContent: 'center' }}>
                <Settings size={16} />
              </button>
            </div>

            {/* Auth */}
            {isAuthenticated && user ? (
              <div className="user-badge" style={{ justifyContent: 'space-between', padding: '12px 0' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  <User size={16} style={{ display: 'inline', marginRight: 6 }} />
                  {user.name}
                  {isAdmin && <span style={{ fontSize: '0.75rem', marginLeft: 4, opacity: 0.7 }}>{t('layout.adminBadge')}</span>}
                </span>
                <button className="btn-icon" onClick={onLogout} type="button">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button className="btn-toggle" onClick={onLogin} type="button" style={{ width: '100%', justifyContent: 'center', backgroundColor: '#FC6D26', color: '#fff', border: 'none' }}>
                <LogIn size={16} />
                {t('layout.loginGitLab')}
              </button>
            )}

            {/* Backend Status */}
            <BackendStatus status={backendStatus} t={t} />
          </div>
        </MobileDrawer>
      )}

      {/* Main Content */}
      <main className="app-main" role="main">
        {children}
      </main>

      <ShortcutHelpOverlay isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {isMobile && <MobileBottomNav isAdmin={isAdmin} />}

      {/* Footer */}
      <footer className="app-footer" role="contentinfo">
        <div className="footer-content">
          <span>{t('layout.footer.copyright')}</span>
          {lastUpdate && (
            <span className="last-update">{t('layout.footer.lastUpdate')}: {lastUpdate.toLocaleTimeString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')}</span>
          )}
          <span>{t('layout.footer.standards')}</span>
        </div>
      </footer>
    </div>
  );
}
