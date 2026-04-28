import React, { createContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import apiService from '../services/api.service';
import { useDashboardSSE } from '../hooks/useDashboardSSE';
import { useProjects, useAnomalies, useCircuitBreakers } from '../hooks/queries';
import type { DashboardMetrics, Project, AnomalyItem, CircuitBreakerState } from '../types/api.types';
import { unwrapApiResponse } from '../types/api.types';

export interface DashboardContextValue {
  projectId: number;
  setProjectId: (id: number) => void;
  projects: Project[];
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  backendStatus: 'checking' | 'ok' | 'error';
  exportHandler: (() => void) | null;
  setExportHandler: (handler: (() => void) | null) => void;
  selectedPreprodMilestones: number[];
  setSelectedPreprodMilestones: (milestones: number[]) => void;
  selectedProdMilestones: number[];
  setSelectedProdMilestones: (milestones: number[]) => void;
  showProductionSection: boolean;
  setShowProductionSection: (show: boolean) => void;
  autoRefresh: boolean;
  setAutoRefresh: (auto: boolean) => void;
  liveConnected: boolean;
  liveError: string | null;
  anomalies: AnomalyItem[];
  loadAnomalies: () => Promise<void>;
  circuitBreakers: CircuitBreakerState[];
  loadCircuitBreakers: () => Promise<void>;
  checkBackendHealth: () => Promise<void>;
  loadProjects: () => Promise<void>;
  loadDashboardMetrics: (force?: boolean) => Promise<void>;
  handleClearCache: () => Promise<void>;
  isLoadingRef: React.MutableRefObject<boolean>;
  lastRefreshRef: React.MutableRefObject<number>;
  abortControllerRef: React.MutableRefObject<AbortController | null>;
}

export const DashboardContext = createContext<DashboardContextValue | null>(null);

const REFRESH_COOLDOWN = 5000;

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [projectId, setProjectId] = useState(() => parseInt(localStorage.getItem('testmo_projectId') || '1', 10));
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [exportHandler, setExportHandler] = useState<(() => void) | null>(null);
  const [selectedPreprodMilestones, setSelectedPreprodMilestones] = useState<number[]>(() => {
    const saved = localStorage.getItem('testmo_selectedPreprodMilestones');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedProdMilestones, setSelectedProdMilestones] = useState<number[]>(() => {
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

  // ─── React Query hooks (remplacent useState + useEffect manuels) ───────────
  const { data: projects = [], refetch: refetchProjects } = useProjects();

  const { data: anomalies = [], refetch: refetchAnomalies } = useAnomalies(projectId);

  const { data: circuitBreakers = [], refetch: refetchCircuitBreakers } = useCircuitBreakers({ autoRefresh });

  const sse = useDashboardSSE({
    projectId,
    preprodMilestones: selectedPreprodMilestones,
    prodMilestones: selectedProdMilestones,
    enabled: autoRefresh,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRefreshRef = useRef<number>(Date.now());
  const isLoadingRef = useRef<boolean>(false);

  // Appliquer les données SSE temps réel
  useEffect(() => {
    if (sse.data) {
      setMetrics((prev) => ({
        ...sse.data!.metrics,
        qualityRates: sse.data!.qualityRates,
      }));
      setLastUpdate(new Date(sse.data!.timestamp));
      lastRefreshRef.current = Date.now();
    }
  }, [sse.data]);

  const checkBackendHealth = useCallback(async () => {
    try {
      await apiService.healthCheck();
      setBackendStatus('ok');
    } catch (err) {
      setBackendStatus('error');
      console.error('Backend health check failed:', err);
    }
  }, []);

  // Wrappers rétrocompatibles pour les consumers (useAutoRefresh, App.jsx, etc.)
  const loadProjects = useCallback(async () => {
    await refetchProjects();
  }, [refetchProjects]);

  const handleClearCache = useCallback(async () => {
    try {
      await apiService.clearCache();
    } catch (err) {
      setError((err as Error).message || 'Erreur nettoyage cache');
    }
  }, []);

  const loadAnomalies = useCallback(async () => {
    await refetchAnomalies();
  }, [refetchAnomalies]);

  const loadCircuitBreakers = useCallback(async () => {
    await refetchCircuitBreakers();
  }, [refetchCircuitBreakers]);

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

        const metricsData = unwrapApiResponse(metricsResponse);
        setMetrics({
          ...metricsData,
          qualityRates: qualityResponse.success ? qualityResponse.data : null,
        });
        setLastUpdate(new Date());
        lastRefreshRef.current = Date.now();
      } catch (err) {
        if (
          (err as Error).name === 'AbortError' ||
          (err as Error).name === 'CanceledError' ||
          controller.signal.aborted
        ) {
          return;
        }
        setError((err as Error).message);
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
      localStorage.setItem('testmo_projectId', String(projectId));
      localStorage.setItem('testmo_selectedPreprodMilestones', JSON.stringify(selectedPreprodMilestones));
      localStorage.setItem('testmo_selectedProdMilestones', JSON.stringify(selectedProdMilestones));
      localStorage.setItem('testmo_showProductionSection', String(showProductionSection));
      localStorage.setItem('testmo_autoRefresh', String(autoRefresh));
    } catch (err) {
      console.warn('localStorage quota exceeded:', err);
    }
  }, [projectId, selectedPreprodMilestones, selectedProdMilestones, showProductionSection, autoRefresh]);

  // Sync cross-onglets via événement storage
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'testmo_projectId') {
        const id = parseInt(e.newValue || '1', 10);
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
      circuitBreakers,
      loadCircuitBreakers,
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
      circuitBreakers,
      loadCircuitBreakers,
      checkBackendHealth,
      loadProjects,
      loadDashboardMetrics,
      handleClearCache,
    ]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}
