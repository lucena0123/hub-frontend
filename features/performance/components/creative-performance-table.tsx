'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdCreativeMetric, CreativeLibraryResponse } from '@/types';

import { type CreativeObjectiveMeta } from './creative-performance-table/columns';
import { CreativeAdCard } from './creative-performance-table/creative-ad-card';
import { CreativePerformanceEmptyState, CreativePerformanceLoadingCard } from './creative-performance-table/states';
import { useCreativePerformanceTableState } from './creative-performance-table/use-creative-performance-table-state';

interface CreativePerformanceTableProps {
  ads: AdCreativeMetric[];
  loading?: boolean;
  creativeLibraryData?: CreativeLibraryResponse | null;
  objective?: string | null;
  objectiveMeta?: CreativeObjectiveMeta;
}

export function CreativePerformanceTable({
  ads,
  loading,
  creativeLibraryData,
  objective,
  objectiveMeta,
}: CreativePerformanceTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const {
    sortedAds,
    libraryLookup,
    objectiveKey,
    columns,
    showVideoMetrics,
  } = useCreativePerformanceTableState({
    ads,
    creativeLibraryData,
    objective,
    objectiveMeta,
  });

  if (loading) {
    return <CreativePerformanceLoadingCard />;
  }

  const toggleExpanded = (rowKey: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(rowKey)) next.delete(rowKey);
      else next.add(rowKey);
      return next;
    });
  };

  return (
    <Card className="border-l-4 border-l-pink-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          Performance de Criativos
          <Badge variant="outline">Anúncios</Badge>
        </CardTitle>
        <CardDescription>Análise individual de cada anúncio{showVideoMetrics ? ' com métricas de vídeo' : ''}</CardDescription>
      </CardHeader>
      <CardContent>
        {sortedAds.length === 0 ? (
          <CreativePerformanceEmptyState />
        ) : (
          <div className="space-y-4">
            {sortedAds.map((ad) => {
              const snapshotId = ad.creative?.snapshotId || ad.creativeSnapshotId || null;
              const rowKey = snapshotId ? `${ad.adId}:${snapshotId}` : ad.adId;

              return (
                <CreativeAdCard
                  key={rowKey}
                  ad={ad}
                  columns={columns}
                  expanded={expanded}
                  libraryLookup={libraryLookup}
                  objectiveKey={objectiveKey}
                  onToggleExpanded={toggleExpanded}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
