'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import type { KpiDelta } from '@/types';

interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: KpiDelta;
  sparklineData?: number[];
  valueColor?: string;
}

export function KpiCard({
  label,
  value,
  unit,
  delta,
  sparklineData,
  valueColor = 'text-foreground',
}: KpiCardProps) {
  const isUp = delta && delta.value >= 0;
  const sparkPoints = sparklineData?.map((v, i) => ({ v, i }));

  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-2">
        {label}
      </p>

      <div className="flex items-end justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className={cn('text-[32px] font-extrabold leading-none', valueColor)}>
            {value}
          </span>
          {unit && (
            <span className="text-sm text-muted-foreground">{unit}</span>
          )}
        </div>

        {delta && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold flex-shrink-0',
              isUp
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            )}
          >
            {isUp ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(delta.pct).toFixed(1)}%
          </span>
        )}
      </div>

      {sparkPoints && sparkPoints.length > 0 && (
        <div className="mt-3 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkPoints}>
              <Line
                type="monotone"
                dataKey="v"
                stroke="var(--primary)"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
