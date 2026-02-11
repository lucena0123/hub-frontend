import type { LucideIcon } from 'lucide-react';
import { AlertOctagon, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PerformanceAlert } from '@/types';
import { format } from 'date-fns';

const typeConfig: Record<
  PerformanceAlert['type'],
  { label: string; className: string; icon: LucideIcon }
> = {
  critical: {
    label: 'Critical',
    className: 'border border-destructive/50 bg-destructive/10 text-destructive',
    icon: AlertOctagon,
  },
  warning: {
    label: 'Warning',
    className: 'border border-amber-400/50 bg-amber-400/10 text-amber-300',
    icon: AlertTriangle,
  },
  info: {
    label: 'Info',
    className: 'border border-primary/50 bg-primary/10 text-primary',
    icon: Info,
  },
};

const categoryLabels: Record<string, string> = {
  roas: 'ROAS',
  ctr: 'CTR',
  budget: 'Budget',
  cpl: 'CPL',
  conversions: 'Conversoes',
  bpmn: 'BPMN',
};

const formatValue = (category: string, value: number) => {
  if (!Number.isFinite(value)) return '-';

  switch (category) {
    case 'roas':
      return `${value.toFixed(2)}x`;
    case 'ctr':
      return `${value.toFixed(2)}%`;
    case 'budget':
      return `${value.toFixed(1)}%`;
    case 'cpl':
      return `$${value.toFixed(2)}`;
    case 'conversions':
      return Math.round(value).toString();
    case 'bpmn':
      return value === 0 ? '-' : value.toString();
    default:
      return value.toString();
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
      ? format(parsedDate, 'MMM dd, HH:mm')
      : '-';

  return (
    <Card className="edge-card hover-lift">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">{alert.clientName}</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={config.className}>{config.label}</Badge>
          <Badge variant="outline">{categoryLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {alert.campaignName ?? 'Client level'}
          </span>
          {alert.campaignName && (
            <span className="ml-2 text-xs text-muted-foreground">
              ({alert.metric})
            </span>
          )}
        </div>
        <p className="text-sm text-foreground">{alert.message}</p>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>
            <span className="font-medium text-foreground">{alert.metric}</span>{' '}
            {currentValue} vs {thresholdValue}
          </span>
          <span>{timestamp}</span>
        </div>
      </CardContent>
    </Card>
  );
}
