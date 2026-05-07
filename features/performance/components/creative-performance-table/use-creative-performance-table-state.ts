import { useMemo } from 'react';

import type { AdCreativeMetric, CreativeLibraryResponse } from '@/types';
import { buildColumns, resolveObjectiveKey, type CreativeObjectiveMeta } from './columns';

interface UseCreativePerformanceTableStateParams {
  ads: AdCreativeMetric[];
  creativeLibraryData?: CreativeLibraryResponse | null;
  objective?: string | null;
  objectiveMeta?: CreativeObjectiveMeta;
}

export function useCreativePerformanceTableState({
  ads,
  creativeLibraryData,
  objective,
  objectiveMeta,
}: UseCreativePerformanceTableStateParams) {
  const sortedAds = useMemo(() => {
    return [...ads].sort((a, b) => (b.totalSpend || 0) - (a.totalSpend || 0));
  }, [ads]);

  const libraryLookup = useMemo(() => {
    const map = new Map<string, {
      status: NonNullable<CreativeLibraryResponse['creatives']>[number]['status'];
      reasons: NonNullable<NonNullable<CreativeLibraryResponse['creatives']>[number]['analysis']>['reasons'];
    }>();
    if (!creativeLibraryData?.creatives) return map;
    for (const creative of creativeLibraryData.creatives) {
      if (creative.snapshotId && creative.status !== 'neutral') {
        map.set(creative.snapshotId, { status: creative.status, reasons: creative.analysis?.reasons ?? [] });
      }
    }
    return map;
  }, [creativeLibraryData]);

  const hasVideoData = sortedAds.some((ad) => ad.video3secViews > 0 || ad.videoThruplay > 0);
  const objectiveKey = useMemo(() => resolveObjectiveKey(objective, objectiveMeta, sortedAds), [objective, objectiveMeta, sortedAds]);
  const columns = useMemo(() => buildColumns(objectiveKey, hasVideoData), [objectiveKey, hasVideoData]);
  const showVideoMetrics = objectiveKey === 'video' && hasVideoData;

  return {
    sortedAds,
    libraryLookup,
    objectiveKey,
    columns,
    showVideoMetrics,
  };
}
