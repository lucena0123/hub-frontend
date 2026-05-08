import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { KpiDelta } from '@/types';

type IconBg = 'indigo' | 'emerald' | 'amber' | 'rose';

const iconBgMap: Record<IconBg, string> = {
  indigo:  'bg-[#eef2ff] text-[#6366f1] dark:bg-[#6366f1]/15 dark:text-[#a5b4fc]',
  emerald: 'bg-[#dcfce7] text-[#15803d] dark:bg-[#15803d]/15 dark:text-[#6ee7b7]',
  amber:   'bg-[#fef9c3] text-[#a16207] dark:bg-[#a16207]/15 dark:text-[#fcd34d]',
  rose:    'bg-[#fee2e2] text-[#b91c1c] dark:bg-[#b91c1c]/15 dark:text-[#f87171]',
};

interface MiniMetricProps {
  icon: LucideIcon;
  iconBg: IconBg;
  label: string;
  value: string;
  delta?: KpiDelta;
  isLast?: boolean;
}

export function MiniMetric({
  icon: Icon,
  iconBg,
  label,
  value,
  delta,
  isLast = false,
}: MiniMetricProps) {
  const isUp = delta && delta.value >= 0;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 py-2.5',
        !isLast && 'border-b border-border'
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={cn(
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
            iconBgMap[iconBg]
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[13px] font-semibold text-foreground truncate">
          {label}
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0 text-right">
        <span className="text-[14px] font-bold text-foreground">{value}</span>
        {delta && (
          <span
            className={cn(
              'text-[11px] font-semibold',
              isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            )}
          >
            {isUp ? '+' : ''}{delta.pct.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}
