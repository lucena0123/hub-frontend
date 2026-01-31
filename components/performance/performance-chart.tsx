'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DailyMetric } from '@/types';
import { formatDate } from '@/lib/utils';

interface PerformanceChartProps {
  title?: string;
  data: DailyMetric[];
}

const formatChartDate = (value: string) => formatDate(value, 'MMM dd', value);

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return `$${value.toLocaleString()}`;
};

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return value.toLocaleString();
};

export function PerformanceChart({ title = 'Performance trend (30d)', data }: PerformanceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
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
                formatter={(value: number, name: string) => {
                  if (name === 'spend') return [formatCurrency(value), 'Spend'];
                  if (name === 'roas') return [value.toFixed(2), 'ROAS'];
                  if (name === 'conversions') return [formatNumber(value), 'Conversions'];
                  return [value, name];
                }}
                labelFormatter={(label) => `Date: ${formatChartDate(label)}`}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="spend"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                name="Spend"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="roas"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={false}
                name="ROAS"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="conversions"
                stroke="hsl(var(--chart-4))"
                strokeWidth={2}
                dot={false}
                name="Conversions"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
