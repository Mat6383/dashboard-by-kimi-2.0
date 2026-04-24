import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import MetricsCards from './MetricsCards';
import StatusChart from './StatusChart';
import RunsList from './RunsList';
import ConfigurationScreen from './ConfigurationScreen';
import AuthCallback from './AuthCallback';
import NotificationSettings from './NotificationSettings';
import HistoricalTrends from './HistoricalTrends';
import CompareDashboard from './CompareDashboard';

// Lazy loading des dashboards administratifs et secondaires
const TvModeDashboard = lazy(() => import('./TvModeDashboard'));
const QualityRatesDashboard = lazy(() => import('./QualityRatesDashboard'));
const GlobalViewDashboard = lazy(() => import('./GlobalViewDashboard'));
const AnnualTrendsDashboard = lazy(() => import('./AnnualTrendsDashboard'));
const GitLabToTestmoSync = lazy(() => import('./GitLabToTestmoSync'));
const CrossTestDashboard = lazy(() => import('./CrossTestDashboard'));
const AutoSyncDashboard = lazy(() => import('./AutoSyncDashboard'));
const MultiProjectDashboard = lazy(() => import('./MultiProjectDashboard'));

function LoadingFallback() {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <p>Chargement du dashboard...</p>
    </div>
  );
}

export default function AppRouter({
  metrics,
  currentProject,
  projects,
  projectId,
  onProjectChange,
  darkMode,
  useBusinessTerms,
  setExportHandler,
  showProductionSection,
  onToggleProductionSection,
  selectedPreprodMilestones,
  selectedProdMilestones,
  onSaveSelection,
}) {
  return (
    <Suspense fallback={<LoadingFallback />}>
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
              onProjectChange={onProjectChange}
              isDark={darkMode}
              useBusiness={useBusinessTerms}
              setExportHandler={setExportHandler}
              showProductionSection={showProductionSection}
              onToggleProductionSection={onToggleProductionSection}
            />
          }
        />
        <Route
          path="/annual-trends"
          element={<AnnualTrendsDashboard projectId={projectId} isDark={darkMode} useBusiness={useBusinessTerms} />}
        />
        <Route path="/sync-gitlab-to-testmo" element={<GitLabToTestmoSync isDark={darkMode} />} />
        <Route path="/crosstest" element={<CrossTestDashboard isDark={darkMode} />} />
        <Route path="/auto-sync" element={<AutoSyncDashboard isDark={darkMode} />} />
        <Route path="/multi-project" element={<MultiProjectDashboard isDark={darkMode} />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/notifications" element={<NotificationSettings isDark={darkMode} />} />
        <Route path="/historical-trends" element={<HistoricalTrends projectId={projectId} isDark={darkMode} />} />
        <Route path="/compare" element={<CompareDashboard isDark={darkMode} />} />
        <Route
          path="/configuration"
          element={
            <ConfigurationScreen
              projectId={projectId}
              isDark={darkMode}
              initialPreprodMilestones={selectedPreprodMilestones}
              initialProdMilestones={selectedProdMilestones}
              onSaveSelection={onSaveSelection}
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
                  <StatusChart metrics={metrics} chartType="bar" useBusiness={useBusinessTerms} isDark={darkMode} />
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
  );
}
