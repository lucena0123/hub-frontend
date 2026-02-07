'use client';

import { Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PerformanceChart } from '@/components/performance/performance-chart';
import type { DailyMetric } from '@/types';

interface CampaignTrendCardProps {
  campaignName: string | null;
  dailyMetrics: DailyMetric[];
  metricsLoading: boolean;
  totalReach: number;
  avgCpm: number;
  totalImpressions: number;
  qualityRanking?: string | null;
  engagementRateRanking?: string | null;
  conversionRateRanking?: string | null;
  hasDelivery: boolean;
}

const rankingLabel: Record<string, string> = {
  ABOVE_AVERAGE_10: 'Top 10%',
  ABOVE_AVERAGE_20: 'Top 20%',
  ABOVE_AVERAGE_35: 'Top 35%',
  ABOVE_AVERAGE: 'Acima da média',
  AVERAGE: 'Na média',
  BELOW_AVERAGE_10: 'Abaixo (Bottom 10%)',
  BELOW_AVERAGE_20: 'Abaixo (Bottom 20%)',
  BELOW_AVERAGE_35: 'Abaixo (Bottom 35%)',
  BELOW_AVERAGE: 'Abaixo',
  UNKNOWN: 'Insuficiente',
};

const rankingColor: Record<string, string> = {
  ABOVE_AVERAGE_10: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  ABOVE_AVERAGE_20: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  ABOVE_AVERAGE_35: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  ABOVE_AVERAGE: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  AVERAGE: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  BELOW_AVERAGE_10: 'border-rose-200 bg-rose-50 text-rose-800',
  BELOW_AVERAGE_20: 'border-rose-200 bg-rose-50 text-rose-800',
  BELOW_AVERAGE_35: 'border-orange-200 bg-orange-50 text-orange-800',
  BELOW_AVERAGE: 'border-orange-200 bg-orange-50 text-orange-800',
  UNKNOWN: 'border-slate-200 bg-slate-50 text-slate-600',
};

const fmtNum = (v: number) => {
  if (!Number.isFinite(v) || v === 0) return '—';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString('pt-BR');
};

const fmtCurrency = (v: number) => {
  if (!Number.isFinite(v) || v === 0) return '—';
  return `R$ ${v.toFixed(2).replace('.', ',')}`;
};

export function CampaignTrendCard({
  campaignName,
  dailyMetrics,
  metricsLoading,
  totalReach,
  avgCpm,
  totalImpressions,
  qualityRanking,
  engagementRateRanking,
  conversionRateRanking,
  hasDelivery,
}: CampaignTrendCardProps) {
  const rankings = [
    qualityRanking && { label: 'Qualidade', value: qualityRanking },
    engagementRateRanking && { label: 'Engajamento', value: engagementRateRanking },
    conversionRateRanking && { label: 'Conversão', value: conversionRateRanking },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">
            {campaignName ?? 'Tendência'}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            <span className="text-muted-foreground">Alcance: <strong>{fmtNum(totalReach)}</strong></span>
            <span className="text-muted-foreground">CPM: <strong>{fmtCurrency(avgCpm)}</strong></span>
            <span className="text-muted-foreground">Impressões: <strong>{fmtNum(totalImpressions)}</strong></span>
          </div>
        </div>
        {rankings.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {rankings.map((r) => (
              <Badge
                key={r.label}
                variant="outline"
                className={`text-[10px] ${rankingColor[r.value] ?? 'text-muted-foreground'}`}
              >
                {r.label}: {rankingLabel[r.value] ?? r.value}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {metricsLoading ? (
          <div className="flex h-[280px] items-center justify-center">
            <Activity className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !hasDelivery ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            Sem dados de entrega no período selecionado.
          </div>
        ) : (
          <PerformanceChart data={dailyMetrics} />
        )}
      </CardContent>
    </Card>
  );
}
