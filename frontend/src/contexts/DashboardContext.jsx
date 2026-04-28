import React, { createContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import apiService from '../services/api.service';
import { useDashboardSSE } from '../hooks/useDashboardSSE';

export const DashboardContext = createContext(null);

const REFRESH_COOLDOWN = 5000;

export function DashboardProvider({ children }) {
  const [projectId, setProjectId] = useState(() => parseInt(localStorage.getItem('testmo_projectId')) || 1);
  const [projects, setProjects] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [exportHandler, setExportHandler] = useState(null);
  const [selectedPreprodMilestones, setSelectedPreprodMilestones] = useState(() => {
    const saved = localStorage.getItem('testmo_selectedPreprodMilestones');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedProdMilestones, setSelectedProdMilestones] = useState(() => {
    const saved = localStorage.getItem('testmo_selectedProdMilestones');
    return saved ? JSON.parse(saved) : [];
  });
  const [showProductionSection, setShowProductionSection] = useState(() => {
    const saved = localStorage.getItem('testmo_showProductionSection');
    return saved !== null ? saved === 'true' : true;
  });

  const [autoRefresh, setAutoRefresh] = useState(() => {
    const saved = localStorage.getItem('testmo_autoRefresh');
    return saved !== null ? saved === 'true' : true;
  });
  const [anomalies, setAnomalies] = useState([]);

  const sse = useDashboardSSE({
    projectId,
    preprodMilestones: selectedPreprodMilestones,
    prodMilestones: selectedProdMilestones,
    enabled: autoRefresh,
  });

  const abortControllerRef = useRef(null);
  const lastRefreshRef = useRef(Date.now());
  const isLoadingRef = useRef(false);

  // Appliquer les données SSE temps réel
  useEffect(() => {
    if (sse.data) {
      setMetrics((prev) => ({
        ...sse.data.metrics,
        qualityRates: sse.data.qualityRates,
      }));
      setLastUpdate(new Date(sse.data.timestamp));
      lastRefreshRef.current = Date.now();
    }
  }, [sse.data]);

  // Charger les anomalies quand le projet change
  useEffect(() => {
    loadAnomalies();
  }, [loadAnomalies]);

  const checkBackendHealth = useCallback(async () => {
    try {
      await apiService.healthCheck();
      setBackendStatus('ok');
    } catch (err) {
      setBackendStatus('error');
      console.error('Backend health check failed:', err);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const response = await apiService.getProjects();
      if (response.success && response.data.result) {
        setProjects(response.data.result);
      }
    } catch (err) {
      setError(err.message || 'Erreur chargement projets');
    }
  }, []);

  const handleClearCache = useCallback(async () => {
    try {
      await apiService.clearCache();
    } catch (err) {
      setError(err.message || 'Erreur nettoyage cache');
    }
  }, []);

  const loadAnomalies = useCallback(async () => {
    try {
      const response = await apiService.getAnomalies(projectId);
      if (response.success) {
        setAnomalies(response.data);
      }
    } catch (err) {
      console.warn('Erreur chargement anomalies:', err.message);
    }
  }, [projectId]);

  const loadDashboardMetrics = useCallback(
    async (force = false) => {
      if (isLoadingRef.current && !force) {
        console.log('[loadDashboardMetrics] Chargement déjà en cours, ignoré');
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      isLoadingRef.current = true;

      try {
        setLoading(true);
        setError(null);

        const preprod = selectedPreprodMilestones.length > 0 ? selectedPreprodMilestones : null;
        const prod = selectedProdMilestones.length > 0 ? selectedProdMilestones : null;

        const [metricsResponse, qualityResponse] = await Promise.all([
          apiService.getDashboardMetrics(projectId, preprod, prod, controller.signal),
          apiService.getQualityRates(projectId, preprod, prod, controller.signal),
        ]);

        if (controller.signal.aborted) return;

        if (metricsResponse.success) {
          setMetrics({
            ...metricsResponse.data,
            qualityRates: qualityResponse.success ? qualityResponse.data : null,
          });
          setLastUpdate(new Date());
          lastRefreshRef.current = Date.now();
        } else {
          throw new Error(metricsResponse.error || 'Erreur inconnue');
        }
      } catch (err) {
        if (err.name === 'AbortError' || err.name === 'CanceledError' || controller.signal.aborted) return;
        setError(err.message);
        console.error('Erreur chargement métriques:', err);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
        isLoadingRef.current = false;
      }
    },
    [projectId, selectedPreprodMilestones, selectedProdMilestones]
  );

  useEffect(() => {
    try {
      localStorage.setItem('testmo_projectId', projectId);
      localStorage.setItem('testmo_selectedPreprodMilestones', JSON.stringify(selectedPreprodMilestones));
      localStorage.setItem('testmo_selectedProdMilestones', JSON.stringify(selectedProdMilestones));
      localStorage.setItem('testmo_showProductionSection', showProductionSection);
      localStorage.setItem('testmo_autoRefresh', autoRefresh);
    } catch (err) {
      console.warn('localStorage quota exceeded:', err);
    }
  }, [projectId, selectedPreprodMilestones, selectedProdMilestones, showProductionSection, autoRefresh]);

  // Sync cross-onglets via événement storage
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'testmo_projectId') {
        const id = parseInt(e.newValue);
        if (!isNaN(id)) setProjectId(id);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Validation des IDs projets au chargement
  useEffect(() => {
    if (projects.length > 0) {
      const exists = projects.find((p) => p.id === projectId);
      if (!exists) {
        setProjectId(projects[0].id);
      }
    }
  }, [projects, projectId]);

  const value = useMemo(
    () => ({
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
      autoRefresh,
      setAutoRefresh,
      liveConnected: sse.connected,
      liveError: sse.error,
      anomalies,
      loadAnomalies,
      checkBackendHealth,
      loadProjects,
      loadDashboardMetrics,
      handleClearCache,
      isLoadingRef,
      lastRefreshRef,
      abortControllerRef,
    }),
    [
      projectId,
      projects,
      metrics,
      loading,
      error,
      lastUpdate,
      backendStatus,
      exportHandler,
      selectedPreprodMilestones,
      selectedProdMilestones,
      showProductionSection,
      autoRefresh,
      sse.connected,
      sse.error,
      anomalies,
      loadAnomalies,
      checkBackendHealth,
      loadProjects,
      loadDashboardMetrics,
      handleClearCache,
    ]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}
