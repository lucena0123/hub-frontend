import type { LucideIcon } from 'lucide-react';
import { AlertOctagon, AlertTriangle, Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { PerformanceAlert } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const typeConfig: Record<
  PerformanceAlert['type'],
  { icon: LucideIcon; borderClass: string; iconClass: string }
> = {
  critical: {
    icon: AlertOctagon,
    borderClass: 'border-l-destructive',
    iconClass: 'text-destructive',
  },
  warning: {
    icon: AlertTriangle,
    borderClass: 'border-l-amber-500',
    iconClass: 'text-amber-500 dark:text-amber-400',
  },
  info: {
    icon: Info,
    borderClass: 'border-l-primary',
    iconClass: 'text-primary',
  },
};

const categoryLabels: Record<string, string> = {
  roas: 'ROAS',
  ctr: 'CTR',
  budget: 'Budget',
  cpl: 'CPL',
  conversions: 'Conversões',
  bpmn: 'BPMN',
  contacts: 'Contatos',
  qualification: 'Qualificação',
  trend: 'Tendência',
  stalled: 'Sem entrega',
  sync: 'Sincronização',
};

const formatValue = (category: string, value: number) => {
  if (!Number.isFinite(value)) return '-';
  switch (category) {
    case 'roas':        return `${value.toFixed(2)}x`;
    case 'ctr':         return `${value.toFixed(2)}%`;
    case 'budget':      return `${value.toFixed(1)}%`;
    case 'cpl':         return `R$${value.toFixed(2)}`;
    case 'conversions': return Math.round(value).toString();
    case 'bpmn':        return value === 0 ? '-' : value.toString();
    default:            return value.toString();
  }
};

export function AlertCard({ alert }: { alert: PerformanceAlert }) {
  const config = typeConfig[alert.type];
  const Icon = config.icon;
  const categoryLabel = categoryLabels[alert.category] ?? alert.category.toUpperCase();
  const currentValue = formatValue(alert.category, alert.currentValue);
  const thresholdValue = formatValue(alert.category, alert.threshold);
  const parsedDate = alert.createdAt ? new Date(alert.createdAt) : null;
  const timestamp =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? format(parsedDate, 'dd/MM HH:mm')
      : '-';

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 border-l-[3px] transition-colors hover:bg-muted/30',
        config.borderClass
      )}
    >
      {/* Severity icon */}
      <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', config.iconClass)} aria-hidden="true" />

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Row 1: client + category + timestamp */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{alert.clientName}</span>
          <span className="inline-flex items-center rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {categoryLabel}
          </span>
          {alert.campaignName && (
            <span className="text-xs text-muted-foreground truncate max-w-[180px]">
              {alert.campaignName}
            </span>
          )}
          <span className="ml-auto text-[11px] text-muted-foreground flex-shrink-0">{timestamp}</span>
        </div>

        {/* Row 2: message */}
        <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">{alert.message}</p>

        {/* Row 3: metric values + actions */}
        <div className="flex items-center justify-between gap-3 pt-0.5">
          <span className="text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">{alert.metric}</span>
            {' '}{currentValue}
            {' vs '}{thresholdValue}
          </span>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button size="sm" variant="default" asChild className="h-6 px-2.5 text-[11px]">
              <Link href={`/clients/${alert.clientId}/performance`}>Performance</Link>
            </Button>
            <Link
              href={`/optimization/board?clientId=${alert.clientId}`}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Board
            </Link>
            <Link
              href={`/optimization/settings?clientId=${alert.clientId}`}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Regras
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
