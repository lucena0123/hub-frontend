'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DailyMetric } from '@/types';
import { formatDate } from '@/lib/utils';

interface PerformanceChartProps {
  title?: string;
  data: DailyMetric[];
  targetCpl?: number;
}

const formatChartDate = (value: string) => formatDate(value, 'dd/MM', value);

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });
};

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return value.toLocaleString('pt-BR');
};

export function PerformanceChart({ title = 'Tendência da Campanha', data, targetCpl }: PerformanceChartProps) {
  const chartData = useMemo(() => {
    return data.map((point) => {
      const messagingConversations = point.messagingConversations ?? 0;
      const conversions = point.conversions ?? 0;
      const conversations = messagingConversations > 0 ? messagingConversations : conversions;
      const cpl = conversations > 0 ? point.spend / conversations : 0;
      return {
        ...point,
        conversations,
        cpl,
      };
    });
  }, [data]);

  const hasExplicitTargetCpl = Number.isFinite(targetCpl) && (targetCpl ?? 0) > 0;

  const computedTargetCpl = useMemo(() => {
    if (hasExplicitTargetCpl) return targetCpl!;

    const totalSpend = chartData.reduce((sum, point) => sum + (point.spend || 0), 0);
    const totalConversations = chartData.reduce((sum, point) => sum + (point.conversations || 0), 0);
    return totalConversations > 0 ? totalSpend / totalConversations : 0;
  }, [chartData, hasExplicitTargetCpl, targetCpl]);

  const targetLabel = hasExplicitTargetCpl ? 'Meta CPL' : 'CPL médio';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={formatChartDate} />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(value) => formatCurrency(Number(value))}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value) => formatNumber(Number(value))}
                />
                <Tooltip
                  formatter={(value: number | undefined, name: string | undefined) => {
                    const safeValue = value ?? 0;
                    if (name === 'spend' || name === 'Investimento') return [formatCurrency(safeValue), 'Investimento'];
                    if (name === 'conversations' || name === 'Conversas') return [formatNumber(safeValue), 'Conversas'];
                    return [safeValue, name || ''];
                  }}
                  labelFormatter={(label) => `Data: ${formatChartDate(label)}`}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="spend"
                  fill="hsl(var(--primary))"
                  name="Investimento"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="conversations"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth={2}
                  dot={false}
                  name="Conversas"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[120px]">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">CPL (R$)</p>
              <p className="text-xs text-muted-foreground">
                {targetLabel}: {computedTargetCpl > 0 ? formatCurrency(computedTargetCpl) : '-'}
              </p>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={formatChartDate} hide />
                <YAxis tickFormatter={(value) => formatCurrency(Number(value))} width={70} />
                <Tooltip
                  formatter={(value: number | undefined) => [formatCurrency(value ?? 0), 'CPL']}
                  labelFormatter={(label) => `Data: ${formatChartDate(label)}`}
                />
                {computedTargetCpl > 0 && (
                  <ReferenceLine
                    y={computedTargetCpl}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="4 4"
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="cpl"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={false}
                  name="CPL"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
