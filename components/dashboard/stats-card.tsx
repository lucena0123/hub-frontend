import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

type AccentColor = 'signal' | 'emerald' | 'amber' | 'red' | 'slate';

const colorMap: Record<AccentColor, { icon: string; bg: string; border: string }> = {
  signal: {
    icon: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-l-primary',
  },
  emerald: {
    icon: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-l-emerald-500',
  },
  amber: {
    icon: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-l-amber-500',
  },
  red: {
    icon: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-l-red-500',
  },
  slate: {
    icon: 'text-muted-foreground',
    bg: 'bg-muted',
    border: 'border-l-border',
  },
};

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  color?: AccentColor;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  color = 'slate',
  trend,
}: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <Card className={cn('border-l-4 transition-shadow hover:shadow-md', colors.border)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <p
                className={cn(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          <div className={cn('rounded-lg p-2.5', colors.bg)}>
            <Icon className={cn('h-5 w-5', colors.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
