'use client';

import { useEffect, useState } from 'react';

import { getOptimizationCenterPlaybook } from '@/lib/api/client';
import type { OptimizationCenterPlaybook } from '@/types';

export const useOptimizationPlaybook = (enabled: boolean) => {
  const [playbook, setPlaybook] = useState<OptimizationCenterPlaybook | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!enabled) {
        setLoading(false);
        return;
      }

      if (playbook || loading) return;
      try {
        setLoading(true);
        setError(null);
        const result = await getOptimizationCenterPlaybook();
        if (!active) return;
        setPlaybook(result);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Falha ao carregar playbook.');
        setPlaybook(null);
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [enabled, loading, playbook]);

  return { playbook, loading, error };
};

