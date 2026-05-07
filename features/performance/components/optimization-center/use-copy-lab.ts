'use client';

import { useEffect, useMemo, useState } from 'react';

import { generateCreativeCopyInsights, getCreativeCopyInsights } from '@/lib/api/client';
import type { CreativeCopyInsightsResponse, OptimizationCenterHighlight } from '@/types';

export const useCopyLab = (params: {
  candidates: OptimizationCenterHighlight[];
  theme?: { themeKey: string; themeName: string } | null;
}) => {
  const { candidates, theme } = params;

  const copyCandidates = useMemo(() => {
    const unique = new Map<string, OptimizationCenterHighlight>();
    for (const item of candidates) {
      if (!unique.has(item.snapshotId)) unique.set(item.snapshotId, item);
    }
    return Array.from(unique.values());
  }, [candidates]);

  const [selectedCopySnapshotId, setSelectedCopySnapshotId] = useState<string | null>(null);
  const [copyInsights, setCopyInsights] = useState<CreativeCopyInsightsResponse | null>(null);
  const [copyInsightsLoading, setCopyInsightsLoading] = useState(false);
  const [copyGenerateLoading, setCopyGenerateLoading] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCopySnapshotId) return;
    if (copyCandidates.length === 0) return;
    setSelectedCopySnapshotId(copyCandidates[0].snapshotId);
  }, [copyCandidates, selectedCopySnapshotId]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!selectedCopySnapshotId) return;
      try {
        setCopyInsightsLoading(true);
        setCopyError(null);
        const result = await getCreativeCopyInsights(selectedCopySnapshotId);
        if (!active) return;
        setCopyInsights(result);
      } catch (err: unknown) {
        if (!active) return;
        const message =
          err && typeof err === 'object' && 'response' in err
            ? 'Sem análise ainda. Clique em “Gerar sugestões” para criar.'
            : err instanceof Error
              ? err.message
              : 'Falha ao carregar insights de copy.';
        setCopyError(message);
        setCopyInsights(null);
      } finally {
        if (!active) return;
        setCopyInsightsLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [selectedCopySnapshotId]);

  const generateInsights = async (force?: boolean) => {
    if (!selectedCopySnapshotId) return;
    try {
      setCopyGenerateLoading(true);
      setCopyError(null);
      await generateCreativeCopyInsights(selectedCopySnapshotId, {
        themeKey: theme?.themeKey,
        themeName: theme?.themeName,
        force: Boolean(force),
      });
      const refreshed = await getCreativeCopyInsights(selectedCopySnapshotId);
      setCopyInsights(refreshed);
    } catch (err) {
      setCopyError(err instanceof Error ? err.message : 'Falha ao gerar insights de copy.');
      setCopyInsights(null);
    } finally {
      setCopyGenerateLoading(false);
    }
  };

  return {
    copyCandidates,
    selectedCopySnapshotId,
    setSelectedCopySnapshotId,
    copyInsights,
    copyInsightsLoading,
    copyGenerateLoading,
    copyError,
    generateInsights,
  };
};

