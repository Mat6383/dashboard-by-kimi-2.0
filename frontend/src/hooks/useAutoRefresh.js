import { useEffect } from 'react';

const REFRESH_COOLDOWN = 5000;

/**
 * Hook de gestion du cycle de vie des données dashboard :
 * - Chargement initial au montage
 * - Rechargement quand le projet ou les milestones changent
 * - Auto-refresh toutes les minutes (optionnel)
 * - Rafraîchissement au retour sur l'onglet / focus fenêtre
 */
export function useAutoRefresh({
  autoRefresh,
  checkBackendHealth,
  loadProjects,
  loadDashboardMetrics,
  isLoadingRef,
  lastRefreshRef,
  projectId,
  selectedPreprodMilestones,
  selectedProdMilestones,
  liveConnected = false,
}) {
  // 1. Chargement initial au montage
  useEffect(() => {
    checkBackendHealth();
    loadProjects();
    loadDashboardMetrics(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Recharger quand le projet ou les milestones changent
  useEffect(() => {
    loadDashboardMetrics(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, selectedPreprodMilestones, selectedProdMilestones]);

  // 3. Auto-refresh toutes les minutes (LEAN) — désactivé si SSE live connecté
  useEffect(() => {
    if (!autoRefresh || liveConnected) return;

    const interval = setInterval(() => {
      // eslint-disable-next-line no-console
      console.log('[Auto-refresh] Rechargement des métriques (1m)...');
      loadDashboardMetrics();
    }, 60000);

    return () => clearInterval(interval);
  }, [autoRefresh, liveConnected, loadDashboardMetrics]);

  // 4. Rafraîchissement forcé au retour sur la page
  useEffect(() => {
    if (!autoRefresh) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (isLoadingRef.current) return;
        const now = Date.now();
        if (now - lastRefreshRef.current < REFRESH_COOLDOWN) return;
        // eslint-disable-next-line no-console
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
}
