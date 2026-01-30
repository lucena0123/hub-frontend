import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: number;
    label?: string;
    positiveIsGood?: boolean;
  };
  icon?: LucideIcon;
}

export function MetricsCard({ title, value, subtitle, trend, icon: Icon }: MetricsCardProps) {
  const showTrend = trend && Number.isFinite(trend.value);
  const isPositive = trend ? trend.value >= 0 : false;
  const positiveIsGood = trend?.positiveIsGood ?? true;
  const highlightPositive = positiveIsGood ? isPositive : !isPositive;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {showTrend && (
          <div
            className={cn(
              'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
              highlightPositive
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-rose-100 text-rose-700'
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            <span>{Math.abs(trend.value).toFixed(1)}%</span>
            <span className="text-[10px] text-muted-foreground">{trend.label ?? 'vs last'}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
