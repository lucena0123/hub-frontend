'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCampaignAiInsights, getCreativeAiInsights } from '@/lib/api/client';
import type { AiInsightsResponse, CreativeLibraryResponse } from '@/types';

type AiInsightsPanelProps = {
  campaignId?: string | null;
  campaignName?: string | null;
  creativeLibraryData?: CreativeLibraryResponse | null;
  periodRange?: { startDate: string; endDate: string } | null;
};

const confidenceBadgeClass = (value: number) => {
  if (value >= 0.75) return 'bg-emerald-500 text-white';
  if (value >= 0.55) return 'bg-amber-400 text-amber-950';
  return 'bg-slate-200 text-slate-700';
};

const InsightBlock = ({ title, insight, loading, empty }: {
  title: string;
  insight: AiInsightsResponse | null;
  loading: boolean;
  empty: string;
}) => {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{title}</p>
        {insight?.confidence != null && (
          <Badge className={`text-[10px] ${confidenceBadgeClass(insight.confidence)}`}>
            Confiança {Math.round(insight.confidence * 100)}%
          </Badge>
        )}
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Carregando insights...
        </div>
      ) : insight ? (
        <div className="space-y-2">
          <p className="text-sm">{insight.summary}</p>
          {insight.recommendations.length > 0 && (
            <div className="space-y-1">
              {insight.recommendations.map((rec, idx) => (
                <p key={idx} className="text-xs text-muted-foreground">
                  • {rec}
                </p>
              ))}
            </div>
          )}
          {insight.cached && (
            <Badge variant="outline" className="text-[10px]">
              cache
            </Badge>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{empty}</p>
      )}
    </div>
  );
};

export function AiInsightsPanel({
  campaignId,
  campaignName,
  creativeLibraryData,
  periodRange,
}: AiInsightsPanelProps) {
  const [campaignInsight, setCampaignInsight] = useState<AiInsightsResponse | null>(null);
  const [creativeInsight, setCreativeInsight] = useState<AiInsightsResponse | null>(null);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [creativeLoading, setCreativeLoading] = useState(false);

  const topCreative = useMemo(() => {
    if (!creativeLibraryData?.creatives?.length) return null;
    return creativeLibraryData.creatives[0];
  }, [creativeLibraryData?.creatives]);

  useEffect(() => {
    if (!campaignId || !periodRange?.startDate || !periodRange?.endDate) {
      setCampaignInsight(null);
      return;
    }
    let active = true;

    const load = async () => {
      try {
        setCampaignLoading(true);
        const data = await getCampaignAiInsights(campaignId, {
          startDate: periodRange.startDate,
          endDate: periodRange.endDate,
        });
        if (!active) return;
        setCampaignInsight(data);
      } catch {
        if (!active) return;
        setCampaignInsight(null);
      } finally {
        if (active) setCampaignLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [campaignId, periodRange?.endDate, periodRange?.startDate]);

  useEffect(() => {
    if (!topCreative?.snapshotId || !periodRange?.startDate || !periodRange?.endDate) {
      setCreativeInsight(null);
      return;
    }
    let active = true;

    const load = async () => {
      try {
        setCreativeLoading(true);
        const data = await getCreativeAiInsights(topCreative.snapshotId, {
          startDate: periodRange.startDate,
          endDate: periodRange.endDate,
        });
        if (!active) return;
        setCreativeInsight(data);
      } catch {
        if (!active) return;
        setCreativeInsight(null);
      } finally {
        if (active) setCreativeLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [periodRange?.endDate, periodRange?.startDate, topCreative?.snapshotId]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Insights de IA</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <InsightBlock
          title={campaignName ? `Campanha: ${campaignName}` : 'Campanha selecionada'}
          insight={campaignInsight}
          loading={campaignLoading}
          empty="Selecione uma campanha para visualizar insights."
        />
        <InsightBlock
          title={topCreative?.headline ? `Criativo: ${topCreative.headline}` : 'Criativo em destaque'}
          insight={creativeInsight}
          loading={creativeLoading}
          empty="Sem criativos suficientes para gerar insights."
        />
      </CardContent>
    </Card>
  );
}
