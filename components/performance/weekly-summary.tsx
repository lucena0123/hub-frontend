'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Sparkles, TrendingUp, TrendingDown, AlertTriangle, ArrowRight, RefreshCw, Calendar, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api/client/http';
import { PromptBadge } from '@/components/ui/prompt-badge';

type WeeklySummaryData = {
  clientId: string;
  weekStart: string;
  weekEnd: string;
  aiUsed: boolean;
  promptId?: string | null;
  promptVersion?: string | null;
  summary: string;
  highlights: string[];
  concerns: string[];
  nextSteps: string[];
  metricsSnapshot: {
    spend: number;
    conversations: number;
    cpl: number | null;
    spendChange: number | null;
    conversationsChange: number | null;
    cplChange: number | null;
  };
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const integerFormatter = new Intl.NumberFormat('pt-BR');
const percentFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const fullDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
});
const dayFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', timeZone: 'America/Sao_Paulo' });
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'America/Sao_Paulo' });
const yearFormatter = new Intl.DateTimeFormat('pt-BR', { year: 'numeric', timeZone: 'America/Sao_Paulo' });
const monthYearFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo' });

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatInteger(value: number) {
  return integerFormatter.format(value);
}

function formatPercent(value: number) {
  return `${value > 0 ? '+' : ''}${percentFormatter.format(value)}%`;
}

function toDate(value: string): Date | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function formatWeekRange(start: string, end: string) {
  const startDate = toDate(start);
  const endDate = toDate(end);
  if (!startDate || !endDate) return `${start} — ${end}`;

  const sameMonth = monthYearFormatter.format(startDate) === monthYearFormatter.format(endDate);
  if (sameMonth) {
    return `${dayFormatter.format(startDate)}–${dayFormatter.format(endDate)} ${monthFormatter.format(startDate)} ${yearFormatter.format(startDate)}`;
  }
  return `${fullDateFormatter.format(startDate)} — ${fullDateFormatter.format(endDate)}`;
}

function ChangeBadge({ value, invert = false }: { value: number | null; invert?: boolean }) {
  if (value === null) {
    return <span className="text-xs text-muted-foreground">N/A</span>;
  }

  const isNeutral = value === 0;
  const isPositive = !isNeutral && (invert ? value < 0 : value > 0);
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const color = isNeutral ? 'text-muted-foreground' : isPositive ? 'text-emerald-600' : 'text-red-500';
  const bg = isNeutral ? 'bg-muted/60' : isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${color} ${bg}`}>
      <Icon className="h-3 w-3" />
      {formatPercent(value)}
    </span>
  );
}

function KpiCard({
  label,
  value,
  change,
  invert = false,
  helper,
}: {
  label: string;
  value: string;
  change: number | null;
  invert?: boolean;
  helper?: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <ChangeBadge value={change} invert={invert} />
      </div>
      <div className="mt-1 text-lg font-semibold text-foreground">{value}</div>
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}

export function WeeklySummary({ clientId }: { clientId: string }) {
  const [data, setData] = useState<WeeklySummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const checkExisting = useCallback(async () => {
    try {
      const { data: res } = await apiClient.get<{ summaries: WeeklySummaryData[] }>(
        `/api/clients/${clientId}/weekly-summaries`,
        { params: { limit: 1 } }
      );
      if (res.summaries.length > 0) {
        setData(res.summaries[0]);
      }
    } catch {
      // no summaries yet
    } finally {
      setHasChecked(true);
    }
  }, [clientId]);

  useEffect(() => {
    checkExisting();
  }, [checkExisting]);

  const generate = async () => {
    setGenerating(true);
    try {
      const { data: res } = await apiClient.post<WeeklySummaryData>(
        `/api/clients/${clientId}/weekly-summary`
      );
      setData(res);
    } catch (err) {
      console.error('Failed to generate weekly summary', err);
    } finally {
      setGenerating(false);
    }
  };

  if (!hasChecked) return null;

  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Resumo Semanal</p>
              <p className="text-xs text-muted-foreground">Gere um resumo com IA da performance da última semana.</p>
            </div>
          </div>
          <Button onClick={generate} disabled={generating} size="sm">
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-1" />
                Gerar Resumo
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Resumo semanal</CardTitle>
          <Badge variant="outline" className="text-xs">
            {formatWeekRange(data.weekStart, data.weekEnd)}
          </Badge>
          {data.aiUsed && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" /> IA
            </Badge>
          )}
          <PromptBadge promptVersion={data.promptVersion} promptId={data.promptId} />
        </div>
          <Button variant="ghost" size="icon" onClick={generate} disabled={generating} title="Regerar resumo">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary text */}
        <div className="rounded-lg border bg-muted/10 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Resumo</p>
          <p className="mt-1 text-sm text-foreground leading-relaxed">{data.summary}</p>
        </div>

        {/* Metrics snapshot */}
        <div className="grid gap-3 sm:grid-cols-3">
          <KpiCard
            label="Investimento"
            value={formatCurrency(data.metricsSnapshot.spend)}
            change={data.metricsSnapshot.spendChange}
            helper="vs. semana anterior"
          />
          <KpiCard
            label="Conversas"
            value={formatInteger(data.metricsSnapshot.conversations)}
            change={data.metricsSnapshot.conversationsChange}
            helper="vs. semana anterior"
          />
          <KpiCard
            label="CPL"
            value={data.metricsSnapshot.cpl !== null ? formatCurrency(data.metricsSnapshot.cpl) : 'N/A'}
            change={data.metricsSnapshot.cplChange}
            invert
            helper="quanto menor, melhor"
          />
        </div>

        {/* Highlights, Concerns, Next Steps */}
        <div className="grid gap-4 sm:grid-cols-3">
          {data.highlights.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> Destaques
              </p>
              <ul className="space-y-1 list-disc pl-4 text-xs text-muted-foreground leading-relaxed">
                {data.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}
          {data.concerns.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Atenção
              </p>
              <ul className="space-y-1 list-disc pl-4 text-xs text-muted-foreground leading-relaxed">
                {data.concerns.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          {data.nextSteps.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                <ArrowRight className="h-3.5 w-3.5" /> Próximos Passos
              </p>
              <ul className="space-y-1 list-disc pl-4 text-xs text-muted-foreground leading-relaxed">
                {data.nextSteps.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
