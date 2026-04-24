/**
 * ================================================
 * TESTMO DASHBOARD - Main Application
 * ================================================
 * Point d'entrée React : orchestre le layout, le routing
 * et le cycle de vie des données via hooks dédiés.
 *
 * @author Matou - Neo-Logix QA Lead
 * @version 2.0.0
 */

import React, { useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import { usePreferences } from './hooks/usePreferences';
import { useDashboard } from './hooks/useDashboard';
import { useAutoRefresh } from './hooks/useAutoRefresh';
import { useAuth } from './hooks/useAuth';
import { useToast } from './hooks/useToast';
import apiService from './services/api.service';
import { AlertCircle, RefreshCw } from 'lucide-react';
import AppLayout from './components/AppLayout';
import AppRouter from './components/AppRouter';
import './styles/App.css';

function App() {
  const { isDark, tvMode, toggleDark, toggleTv } = useTheme();
  const { user, isAuthenticated, isAdmin, loginWithGitLab, logout } = useAuth();
  const { showToast } = useToast();
  const { useBusinessTerms, setUseBusinessTerms, autoRefresh, setAutoRefresh } = usePreferences();
  const {
    projectId,
    setProjectId,
    projects,
    metrics,
    loading,
    error,
    backendStatus,
    exportHandler,
    setExportHandler,
    lastUpdate,
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

  useAutoRefresh({
    autoRefresh,
    checkBackendHealth,
    loadProjects,
    loadDashboardMetrics,
    isLoadingRef,
    lastRefreshRef,
    projectId,
    selectedPreprodMilestones,
    selectedProdMilestones,
  });

  const handleProjectChange = (event) => setProjectId(parseInt(event.target.value));
  const handleDashboardChange = (event) => navigate(event.target.value);

  const handleExportPdfBackend = async () => {
    if (!projectId) return;
    try {
      const blob = await apiService.generateBackendPDF(
        projectId,
        { preprod: selectedPreprodMilestones, prod: selectedProdMilestones },
        'A4',
        isDark
      );
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `qa-dashboard-${projectId}-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('PDF généré avec succès', 'success');
    } catch (err) {
      showToast('Erreur génération PDF', 'error');
    }
  };

  if (error && !metrics) {
    return (
      <div className="app-error">
        <AlertCircle size={48} color="#EF4444" />
        <h2>Erreur de Chargement</h2>
        <p>{error}</p>
        <button onClick={() => loadDashboardMetrics()} className="btn-retry" type="button">
          <RefreshCw size={16} />
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <AppLayout
      darkMode={isDark}
      tvMode={tvMode}
      toggleDarkMode={toggleDark}
      toggleTvMode={toggleTv}
      useBusinessTerms={useBusinessTerms}
      setUseBusinessTerms={setUseBusinessTerms}
      autoRefresh={autoRefresh}
      setAutoRefresh={setAutoRefresh}
      projectId={projectId}
      projects={projects}
      onProjectChange={handleProjectChange}
      onDashboardChange={handleDashboardChange}
      onRefresh={() => loadDashboardMetrics()}
      onClearCache={handleClearCache}
      loading={loading}
      backendStatus={backendStatus}
      lastUpdate={lastUpdate}
      currentPath={location.pathname}
      exportHandler={exportHandler}
      user={user}
      isAuthenticated={isAuthenticated}
      isAdmin={isAdmin}
      onLogin={loginWithGitLab}
      onLogout={logout}
      onExportPdfBackend={handleExportPdfBackend}
    >
      {loading && !metrics ? (
        <div className="loading-container">
          <RefreshCw size={48} className="spinner" />
          <p>Chargement des métriques ISTQB...</p>
        </div>
      ) : (
        <AppRouter
          metrics={metrics}
          currentProject={currentProject}
          projects={projects}
          projectId={projectId}
          onProjectChange={setProjectId}
          darkMode={isDark}
          useBusinessTerms={useBusinessTerms}
          setExportHandler={setExportHandler}
          showProductionSection={showProductionSection}
          onToggleProductionSection={setShowProductionSection}
          selectedPreprodMilestones={selectedPreprodMilestones}
          selectedProdMilestones={selectedProdMilestones}
          onSaveSelection={handleSaveSelection}
        />
      )}
    </AppLayout>
  );
}

export default App;
