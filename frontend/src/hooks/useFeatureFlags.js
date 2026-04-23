import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../services/api.service';

/**
 * Hook pour consommer les feature flags du backend.
 * @param {string|null} key - Si fourni, retourne uniquement ce flag. Sinon retourne tous.
 * @returns {{ flags: Object|boolean, loading: boolean, error: string|null, toggle: Function }}
 */
export function useFeatureFlags(key = null) {
  const [flags, setFlags] = useState(key ? false : {});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cancelledRef = useRef(false);

  const fetchFlags = useCallback(async () => {
    cancelledRef.current = false;
    try {
      setLoading(true);
      const url = key ? `/feature-flags/${key}` : '/feature-flags';
      const res = await apiClient.get(url);
      if (cancelledRef.current) return;
      setFlags(key ? res.data.data.enabled : res.data.data);
      setError(null);
    } catch (err) {
      if (cancelledRef.current) return;
      setError(err.message);
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [key]);

  const toggle = useCallback(async (flagKey, enabled) => {
    try {
      await apiClient.put(`/feature-flags/${flagKey}`, { enabled });
      if (cancelledRef.current) return;
      setFlags((prev) => {
        if (typeof prev === 'boolean') return enabled;
        return { ...prev, [flagKey]: enabled };
      });
    } catch (err) {
      if (cancelledRef.current) return;
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
    return () => {
      cancelledRef.current = true;
    };
  }, [fetchFlags]);

  return { flags, loading, error, toggle, refresh: fetchFlags };
}
