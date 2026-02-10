'use client';

import { useEffect, useState } from 'react';
import { Loader2, TrendingDown, TrendingUp, Users, Lightbulb } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAudienceInsights, type AudienceInsightsResponse, type AudienceSegment } from '@/lib/api/client';

function SegmentBar({ segments, totalSpend }: { segments: AudienceSegment[]; totalSpend: number }) {
  if (segments.length === 0 || totalSpend === 0) return null;

  const top = segments.slice(0, 8);
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500',
    'bg-cyan-500', 'bg-rose-500', 'bg-indigo-500', 'bg-orange-500',
  ];

  return (
    <div className="space-y-2">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {top.map((seg, i) => (
          <div
            key={seg.segment}
            className={`${colors[i % colors.length]} transition-all`}
            style={{ width: `${Math.max(seg.spendShare, 1)}%` }}
            title={`${seg.segment}: ${seg.spendShare.toFixed(1)}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {top.map((seg, i) => (
          <div key={seg.segment} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className={`inline-block h-2 w-2 rounded-full ${colors[i % colors.length]}`} />
            {seg.segment} ({seg.spendShare.toFixed(0)}%)
          </div>
        ))}
      </div>
    </div>
  );
}

function SegmentCard({ segment, type }: { segment: AudienceSegment; type: 'best' | 'wasteful' }) {
  const isBest = type === 'best';
  const borderColor = isBest
    ? 'border-emerald-200 dark:border-emerald-900'
    : 'border-red-200 dark:border-red-900';
  const bgColor = isBest
    ? 'bg-emerald-50/50 dark:bg-emerald-950/20'
    : 'bg-red-50/50 dark:bg-red-950/20';

  return (
    <div className={`rounded-lg border p-3 space-y-1 ${borderColor} ${bgColor}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{segment.segment}</span>
        {isBest ? (
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500" />
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>CPL: <strong className={isBest ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
          {segment.cpl != null ? `R$ ${segment.cpl.toFixed(2)}` : 'N/A'}
        </strong></span>
        <span>{segment.conversations} conversas</span>
        <span>{segment.spendShare.toFixed(0)}% do spend</span>
      </div>
    </div>
  );
}

export function AudienceInsights({ clientId, campaignId }: { clientId: string; campaignId: string | null }) {
  const [stateCampaignId, setStateCampaignId] = useState<string | null>(null);
  const [data, setData] = useState<AudienceInsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) {
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setStateCampaignId(campaignId);
      setData(null);
      setLoading(true);
      setError(null);
    });

    getAudienceInsights(clientId, { campaignId, period: '30d' })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar insights');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [clientId, campaignId]);

  if (!campaignId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8 text-muted-foreground">
          Selecione uma campanha para ver insights de audiência.
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (stateCampaignId !== campaignId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8 text-sm text-red-500">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (!data || data.allSegments.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8 text-muted-foreground text-sm">
          Sem dados de audiência disponíveis para esta campanha.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Insights de Audiência</CardTitle>
        </div>
        <CardDescription className="flex items-center gap-3">
          <span>Spend total: R$ {data.totalSpend.toFixed(2)}</span>
          <span>{data.totalConversations} conversas</span>
          {data.avgCpl != null && <span>CPL médio: R$ {data.avgCpl.toFixed(2)}</span>}
          <Badge variant="outline" className="text-[10px]">Últimos 30 dias</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Spend distribution bar */}
        <SegmentBar segments={data.allSegments} totalSpend={data.totalSpend} />

        {/* Best and worst segments */}
        <div className="grid gap-4 md:grid-cols-2">
          {data.bestSegments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Melhores Segmentos
              </h4>
              {data.bestSegments.map((seg) => (
                <SegmentCard key={seg.segment} segment={seg} type="best" />
              ))}
            </div>
          )}

          {data.wastefulSegments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1">
                <TrendingDown className="h-3 w-3" /> Segmentos com Desperdício
              </h4>
              {data.wastefulSegments.map((seg) => (
                <SegmentCard key={seg.segment} segment={seg} type="wasteful" />
              ))}
            </div>
          )}
        </div>

        {/* Recommendation */}
        {data.recommendation && (
          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20 p-3">
            <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">{data.recommendation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
