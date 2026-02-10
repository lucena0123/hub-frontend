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
  ReferenceLine,
} from 'recharts';
import type { DailyMetric } from '@/types';
import { formatDate } from '@/lib/utils';

interface PerformanceChartProps {
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

const axisLabelStyle = {
  fill: 'var(--muted-foreground)',
  fontSize: 10,
  fontWeight: 500,
};

const tickStyle = {
  fill: 'var(--muted-foreground)',
  fontSize: 11,
};

const gridStyle = {
  stroke: 'var(--border)',
  strokeOpacity: 0.35,
};

const tooltipStyles = {
  backgroundColor: 'var(--card)',
  borderColor: 'var(--border)',
  color: 'var(--foreground)',
  borderRadius: 8,
  fontSize: 12,
};

const legendStyle = {
  color: 'var(--muted-foreground)',
  fontSize: 11,
};

export function PerformanceChart({ data, targetCpl }: PerformanceChartProps) {
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
  const tickInterval = chartData.length > 14 ? Math.max(1, Math.ceil(chartData.length / 7)) : 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="inline-flex items-center gap-4" style={legendStyle}>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--color-chart-1)' }} />
            Investimento
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--color-chart-3)' }} />
            Conversas
          </span>
        </div>
        <span className="text-[11px] uppercase tracking-wider">Tendência da campanha</span>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 28, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" {...gridStyle} />
            <XAxis
              dataKey="date"
              tickFormatter={formatChartDate}
              tick={tickStyle}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={{ stroke: 'var(--border)' }}
              interval={tickInterval}
              minTickGap={18}
              tickMargin={6}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={(value) => formatCurrency(Number(value))}
              tick={tickStyle}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={{ stroke: 'var(--border)' }}
              width={72}
              label={{ value: 'Investimento (R$)', angle: -90, position: 'insideLeft', offset: 0, style: axisLabelStyle }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => formatNumber(Number(value))}
              tick={tickStyle}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={{ stroke: 'var(--border)' }}
              width={56}
              label={{ value: 'Conversas (qtd)', angle: 90, position: 'insideRight', offset: 4, style: axisLabelStyle }}
            />
            <Tooltip
              formatter={(value: number | undefined, name: string | undefined) => {
                const safeValue = value ?? 0;
                if (name === 'spend' || name === 'Investimento') return [formatCurrency(safeValue), 'Investimento'];
                if (name === 'conversations' || name === 'Conversas') return [formatNumber(safeValue), 'Conversas'];
                return [safeValue, name || ''];
              }}
              labelFormatter={(label) => `Data: ${formatChartDate(label)}`}
              contentStyle={tooltipStyles}
            />
            <Bar
              yAxisId="left"
              dataKey="spend"
              fill="var(--color-chart-1)"
              name="Investimento"
              radius={[4, 4, 0, 0]}
              barSize={16}
              fillOpacity={0.75}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="conversations"
              stroke="var(--color-chart-3)"
              strokeWidth={3}
              dot={{ r: 3, fill: 'var(--color-chart-3)' }}
              activeDot={{ r: 5 }}
              name="Conversas"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="h-[105px]">
        <div className="mb-2 flex items-center justify-between border-t border-border/60 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CPL (R$)</p>
          <p className="text-xs text-muted-foreground">
            {targetLabel}: {computedTargetCpl > 0 ? formatCurrency(computedTargetCpl) : '-'}
          </p>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" {...gridStyle} />
            <XAxis dataKey="date" tickFormatter={formatChartDate} hide />
            <YAxis
              tickFormatter={(value) => formatCurrency(Number(value))}
              width={72}
              tick={tickStyle}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={{ stroke: 'var(--border)' }}
            />
            <Tooltip
              formatter={(value: number | undefined) => [formatCurrency(value ?? 0), 'CPL']}
              labelFormatter={(label) => `Data: ${formatChartDate(label)}`}
              contentStyle={tooltipStyles}
            />
            {computedTargetCpl > 0 && (
              <ReferenceLine
                y={computedTargetCpl}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
              />
            )}
            <Line
              type="monotone"
              dataKey="cpl"
              stroke="var(--color-chart-5)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: 'var(--color-chart-5)' }}
              activeDot={{ r: 5 }}
              name="CPL"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
