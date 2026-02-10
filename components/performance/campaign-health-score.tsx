'use client';

import { useEffect, useState } from 'react';
import { Activity, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api/client/http';

type HealthFactor = {
  name: string;
  score: number;
  weight: number;
  weighted: number;
  detail: string;
};

type CampaignHealth = {
  campaignId: string;
  campaignName: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: HealthFactor[];
  recommendation: string;
};

type HealthResponse = {
  clientId: string;
  overallScore: number | null;
  total: number;
  campaigns: CampaignHealth[];
};

const GRADE_COLORS: Record<string, string> = {
  A: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40',
  B: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/40',
  C: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40',
  D: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/40',
  F: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/40',
};

const SCORE_COLOR = (score: number) =>
  score >= 85 ? 'text-emerald-600 dark:text-emerald-400'
    : score >= 70 ? 'text-blue-600 dark:text-blue-400'
      : score >= 50 ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400';

const BAR_COLOR = (score: number) =>
  score >= 80 ? 'bg-emerald-500'
    : score >= 60 ? 'bg-blue-500'
      : score >= 40 ? 'bg-amber-500'
        : 'bg-red-500';

function FactorBar({ factor }: { factor: HealthFactor }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{factor.name} ({(factor.weight * 100).toFixed(0)}%)</span>
        <span className="font-medium">{factor.score}</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${BAR_COLOR(factor.score)}`}
          style={{ width: `${factor.score}%` }}
        />
      </div>
    </div>
  );
}

function CampaignHealthCard({ health }: { health: CampaignHealth }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-lg border p-4 space-y-3 cursor-pointer hover:bg-muted/30 transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold ${GRADE_COLORS[health.grade]}`}>
            {health.grade}
          </span>
          <div>
            <p className="text-sm font-medium truncate max-w-[250px]">{health.campaignName}</p>
            <p className={`text-xs font-bold ${SCORE_COLOR(health.score)}`}>{health.score}/100</p>
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="space-y-3 pt-2 border-t">
          <div className="space-y-2">
            {health.factors.map((f) => (
              <FactorBar key={f.name} factor={f} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground italic">{health.recommendation}</p>
        </div>
      )}
    </div>
  );
}

export function CampaignHealthScores({ clientId }: { clientId: string }) {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    apiClient
      .get<HealthResponse>(`/api/clients/${clientId}/campaign-health`)
      .then(({ data: res }) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [clientId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.campaigns.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Health Score</CardTitle>
          </div>
          {data.overallScore != null && (
            <Badge className={`text-sm font-bold ${GRADE_COLORS[scoreToGrade(data.overallScore)]}`}>
              {data.overallScore}/100
            </Badge>
          )}
        </div>
        <CardDescription>
          Saúde geral das campanhas baseada em CPL, tendência, criativos, frequência e pacing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.campaigns.map((c) => (
          <CampaignHealthCard key={c.campaignId} health={c} />
        ))}
      </CardContent>
    </Card>
  );
}

function scoreToGrade(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 50) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}
