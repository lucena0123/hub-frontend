'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface DayOfWeekData {
  dayOfWeek: number;
  dayName: string;
  totalImpressions: number;
  totalClicks: number;
  totalSpend: number;
  totalConversions: number;
  totalConversations: number;
  avgCtr: number;
  avgCpm: number;
  cpl: number;
  daysCount: number;
}

interface TemporalAnalysisProps {
  data: DayOfWeekData[];
  bestDay: string | null;
  worstDay: string | null;
  cheapestDay: string | null;
  mostExpensiveDay: string | null;
  loading?: boolean;
  title?: string;
  badgeLabel?: string;
  description?: string;
}

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value) || value === 0) return '-';
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
};

const COLORS_BY_PERFORMANCE = {
  best: '#10b981',
  good: '#3b82f6',
  average: '#6b7280',
  poor: '#f59e0b',
  worst: '#ef4444',
};

export function TemporalAnalysis({
  data,
  bestDay,
  worstDay,
  cheapestDay,
  mostExpensiveDay,
  loading,
  title: titleProp,
  badgeLabel: badgeLabelProp,
  description: descriptionProp,
}: TemporalAnalysisProps) {
  const title = titleProp ?? 'Análise Temporal';
  const badgeLabel = badgeLabelProp ?? 'Por dia da semana';
  const description = descriptionProp ?? 'Identifique os melhores dias para investir em anúncios';

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const maxConversations = Math.max(...data.map((d) => d.totalConversations));
    const minConversations = Math.min(...data.filter((d) => d.totalConversations > 0).map((d) => d.totalConversations));

    return data.map((d) => {
      let color = COLORS_BY_PERFORMANCE.average;
      if (d.totalConversations === maxConversations && maxConversations > 0) color = COLORS_BY_PERFORMANCE.best;
      else if (d.totalConversations === minConversations || d.totalConversations === 0) color = COLORS_BY_PERFORMANCE.worst;
      else if (d.totalConversations > maxConversations * 0.7) color = COLORS_BY_PERFORMANCE.good;
      else if (d.totalConversations < maxConversations * 0.3) color = COLORS_BY_PERFORMANCE.poor;

      return {
        name: d.dayName.slice(0, 3),
        fullName: d.dayName,
        conversations: d.totalConversations,
        spend: Number(d.totalSpend.toFixed(2)),
        cpl: Number(d.cpl.toFixed(2)),
        impressions: d.totalImpressions,
        clicks: d.totalClicks,
        color,
      };
    });
  }, [data]);

  if (loading) {
    return (
      <Card className="border-l-4 border-l-teal-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-l-4 border-l-teal-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground text-center py-8">
          Sem dados temporais no período. Rode um sync para preencher.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-teal-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          {title}
          <Badge variant="outline">{badgeLabel}</Badge>
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Insights badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {bestDay && (
            <Badge className="bg-emerald-500">Melhor dia: {bestDay}</Badge>
          )}
          {cheapestDay && (
            <Badge className="bg-blue-500">CPL mais baixo: {cheapestDay}</Badge>
          )}
          {worstDay && worstDay !== bestDay && (
            <Badge variant="outline" className="text-rose-600 border-rose-300">
              Menos conversões: {worstDay}
            </Badge>
          )}
          {mostExpensiveDay && mostExpensiveDay !== cheapestDay && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-300">
              CPL mais alto: {mostExpensiveDay}
            </Badge>
          )}
        </div>

        {/* Bar Chart */}
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              formatter={(value: number | undefined, name: string | undefined) => {
                const safeValue = value ?? 0;
                if (name === 'conversations') return [safeValue, 'Conversas'];
                if (name === 'spend') return [formatCurrency(safeValue), 'Investimento'];
                if (name === 'cpl') return [formatCurrency(safeValue), 'CPL'];
                return [safeValue, name || ''];
              }}
              labelFormatter={(label) => {
                const item = chartData.find(d => d.name === label);
                return item?.fullName || label;
              }}
            />
            <Bar dataKey="conversations" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Day details table */}
        <div className="mt-4 grid grid-cols-7 gap-2 border-t pt-4">
          {data.map((d) => (
            <div key={d.dayOfWeek} className="text-center p-2 rounded-lg bg-teal-500/5 border border-teal-500/10">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{d.dayName.slice(0, 3)}</p>
              <p className="text-lg font-bold mt-0.5">{d.totalConversations}</p>
              <p className="text-[10px] text-muted-foreground">
                {d.cpl > 0 ? formatCurrency(d.cpl) : '-'}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
