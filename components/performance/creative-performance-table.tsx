'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AdCreativeMetric } from '@/types';

import { CreativePerformanceRow } from './creative-performance-table/row';

interface CreativePerformanceTableProps {
  ads: AdCreativeMetric[];
  loading?: boolean;
}

export function CreativePerformanceTable({ ads, loading }: CreativePerformanceTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const sortedAds = useMemo(() => {
    return [...ads].sort((a, b) => (b.totalSpend || 0) - (a.totalSpend || 0));
  }, [ads]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance de Criativos</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  const hasVideoData = sortedAds.some((ad) => ad.video3secViews > 0 || ad.videoThruplay > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Performance de Criativos
          <Badge variant="outline">Ads</Badge>
        </CardTitle>
        <CardDescription>Análise individual de cada anúncio{hasVideoData ? ' com métricas de vídeo' : ''}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Criativo</TableHead>
                <TableHead className="text-right">Conversas</TableHead>
                <TableHead className="text-right">CPL</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">CPM</TableHead>
                {hasVideoData ? (
                  <>
                    <TableHead className="text-right">Hook Rate</TableHead>
                    <TableHead className="text-right">Hold Rate</TableHead>
                  </>
                ) : null}
                <TableHead className="text-right">Investimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={hasVideoData ? 8 : 6} className="text-center text-muted-foreground">
                    Nenhum dado de criativos no período selecionado. Se a campanha não teve entrega, isso é esperado; caso contrário, execute o sync com syncLevel &quot;ad&quot; ou &quot;full&quot;.
                  </TableCell>
                </TableRow>
              ) : (
                sortedAds.map((ad) => {
                  const snapshotId = ad.creative?.snapshotId || ad.creativeSnapshotId || null;
                  const rowKey = snapshotId ? `${ad.adId}:${snapshotId}` : ad.adId;
                  const isExpanded = Boolean(snapshotId && expanded.has(rowKey));

                  return (
                    <CreativePerformanceRow
                      key={rowKey}
                      ad={ad}
                      rowKey={rowKey}
                      snapshotId={snapshotId}
                      expanded={isExpanded}
                      hasVideoData={hasVideoData}
                      onToggle={() => {
                        setExpanded((prev) => {
                          const next = new Set(prev);
                          if (next.has(rowKey)) next.delete(rowKey);
                          else next.add(rowKey);
                          return next;
                        });
                      }}
                    />
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
