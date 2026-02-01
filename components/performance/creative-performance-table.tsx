'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AdCreativeMetric {
  adId: string;
  adName: string;
  adsetId: string;
  totalImpressions: number;
  totalReach: number;
  totalClicks: number;
  totalSpend: number;
  totalConversions: number;
  totalMessagingConversations: number;
  avgCtr: number;
  avgCpm: number;
  cpl: number;
  videoThruplay: number;
  video3secViews: number;
  videoP25: number;
  videoP50: number;
  videoP75: number;
  videoP100: number;
  hookRate: number;
  holdRate: number;
}

interface CreativePerformanceTableProps {
  ads: AdCreativeMetric[];
  loading?: boolean;
}

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return value.toLocaleString('pt-BR');
};

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value) || value === 0) return '-';
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
};

function rateColor(rate: number, type: 'hook' | 'hold'): string {
  if (type === 'hook') {
    if (rate >= 30) return 'text-emerald-600 font-medium';
    if (rate >= 15) return 'text-yellow-600';
    return 'text-rose-600';
  }
  // hold rate
  if (rate >= 50) return 'text-emerald-600 font-medium';
  if (rate >= 25) return 'text-yellow-600';
  return 'text-rose-600';
}

export function CreativePerformanceTable({ ads, loading }: CreativePerformanceTableProps) {
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

  const hasVideoData = ads.some(ad => ad.video3secViews > 0 || ad.videoThruplay > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Performance de Criativos
          <Badge variant="outline">Ads</Badge>
        </CardTitle>
        <CardDescription>
          Análise individual de cada anúncio{hasVideoData ? ' com métricas de vídeo' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anúncio</TableHead>
                <TableHead className="text-right">Conversas</TableHead>
                <TableHead className="text-right">CPL</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">CPM</TableHead>
                {hasVideoData && (
                  <>
                    <TableHead className="text-right">Hook Rate</TableHead>
                    <TableHead className="text-right">Hold Rate</TableHead>
                  </>
                )}
                <TableHead className="text-right">Investimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={hasVideoData ? 8 : 6} className="text-center text-muted-foreground">
                    Nenhum dado de criativos disponível. Execute o sync com syncLevel &quot;ad&quot; ou &quot;full&quot;.
                  </TableCell>
                </TableRow>
              ) : (
                ads.map((ad) => (
                  <TableRow key={ad.adId}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {ad.adName || ad.adId}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(ad.totalMessagingConversations)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(ad.cpl)}</TableCell>
                    <TableCell className="text-right">{ad.avgCtr.toFixed(2)}%</TableCell>
                    <TableCell className="text-right">{formatCurrency(ad.avgCpm)}</TableCell>
                    {hasVideoData && (
                      <>
                        <TableCell className="text-right">
                          <span className={rateColor(ad.hookRate, 'hook')}>
                            {ad.hookRate > 0 ? `${ad.hookRate.toFixed(1)}%` : '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={rateColor(ad.holdRate, 'hold')}>
                            {ad.holdRate > 0 ? `${ad.holdRate.toFixed(1)}%` : '-'}
                          </span>
                        </TableCell>
                      </>
                    )}
                    <TableCell className="text-right">{formatCurrency(ad.totalSpend)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
