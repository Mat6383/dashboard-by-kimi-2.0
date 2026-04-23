import { useState, useEffect, useCallback } from 'react';
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

  const fetchFlags = useCallback(async () => {
    try {
      setLoading(true);
      const url = key ? `/feature-flags/${key}` : '/feature-flags';
      const res = await apiClient.get(url);
      setFlags(key ? res.data.data.enabled : res.data.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [key]);

  const toggle = useCallback(async (flagKey, enabled) => {
    try {
      await apiClient.put(`/feature-flags/${flagKey}`, { enabled });
      setFlags(prev => {
        if (typeof prev === 'boolean') return enabled;
        return { ...prev, [flagKey]: enabled };
      });
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  return { flags, loading, error, toggle, refresh: fetchFlags };
}
