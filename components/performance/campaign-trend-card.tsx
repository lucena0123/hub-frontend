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
  ABOVE_AVERAGE_10: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700',
  ABOVE_AVERAGE_20: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700',
  ABOVE_AVERAGE_35: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700',
  ABOVE_AVERAGE: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700',
  AVERAGE: 'border-slate-500/40 bg-slate-500/15 text-slate-700',
  BELOW_AVERAGE_10: 'border-rose-500/40 bg-rose-500/15 text-rose-700',
  BELOW_AVERAGE_20: 'border-rose-500/40 bg-rose-500/15 text-rose-700',
  BELOW_AVERAGE_35: 'border-orange-500/40 bg-orange-500/15 text-orange-700',
  BELOW_AVERAGE: 'border-orange-500/40 bg-orange-500/15 text-orange-700',
  UNKNOWN: 'border-amber-500/40 bg-amber-500/15 text-amber-700',
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

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-1.5">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

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
      <CardHeader className="space-y-2 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{campaignName ?? 'Tendência da campanha'}</CardTitle>
            <p className="text-xs text-muted-foreground">Visão geral do período selecionado</p>
          </div>
          {rankings.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {rankings.map((r) => (
                <Badge
                  key={r.label}
                  variant="outline"
                  className={`text-[10px] uppercase tracking-wide ${rankingColor[r.value] ?? 'text-muted-foreground'}`}
                >
                  {r.label}: {rankingLabel[r.value] ?? r.value}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <StatPill label="Alcance" value={fmtNum(totalReach)} />
          <StatPill label="CPM médio" value={fmtCurrency(avgCpm)} />
          <StatPill label="Impressões" value={fmtNum(totalImpressions)} />
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
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
