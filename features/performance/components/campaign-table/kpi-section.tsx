import { Badge } from '@/components/ui/badge';
import type { KpiCard, KpiGroup } from './metric-types';

interface CampaignKpiSectionProps {
  advancedKpis: KpiGroup | null;
  kpiCards: KpiCard[];
}

export function CampaignKpiSection({ advancedKpis, kpiCards }: CampaignKpiSectionProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 text-xs">
        {kpiCards.map((card) => (
          <div key={card.label} className="rounded-md border border-border/60 p-3 bg-muted/20">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{card.label}</p>
            <p className="text-sm font-semibold">{card.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{card.helper}</p>
          </div>
        ))}
      </div>
      {advancedKpis && (
        <div className="rounded-md border border-border/60 bg-muted/10 p-3 text-xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{advancedKpis.title}</p>
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
              Avançado
            </Badge>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {advancedKpis.items.map((item) => (
              <div key={item.label} className="rounded-md border border-border/60 bg-background/40 p-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold">{item.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{item.helper}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
