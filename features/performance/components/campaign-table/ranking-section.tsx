import { Badge } from '@/components/ui/badge';
import type { PerformanceSummary } from '@/types';
import { formatDestinationLabel, formatOptimizationLabel } from './campaign-meta';

interface CampaignRankingMeta {
  label: string;
  tone: string;
  hint: string;
}

interface CampaignRankingSectionProps {
  campaign: PerformanceSummary;
  qualityMeta: CampaignRankingMeta;
  engagementMeta: CampaignRankingMeta;
  conversionMeta: CampaignRankingMeta;
  qualityReason: string;
  engagementReason: string;
  conversionReason: string;
  benchmarkMessage: string | null;
  insightMessage: string;
}

export function CampaignRankingSection({
  campaign,
  qualityMeta,
  engagementMeta,
  conversionMeta,
  qualityReason,
  engagementReason,
  conversionReason,
  benchmarkMessage,
  insightMessage,
}: CampaignRankingSectionProps) {
  const rankingItems = [
    { label: 'Qualidade', meta: qualityMeta, reason: qualityReason },
    { label: 'Engajamento', meta: engagementMeta, reason: engagementReason },
    { label: 'Conversão', meta: conversionMeta, reason: conversionReason },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {rankingItems.map((item) => (
          <div key={item.label} className="relative group">
            <Badge variant="outline" className={`text-[10px] ${item.meta.tone}`}>
              {item.label}: {item.meta.label}
            </Badge>
            <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-64 rounded-md border border-border/60 bg-background/95 p-2 text-[11px] text-muted-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Por que?</p>
              <p className="mt-1">{item.reason}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Comparado com campanhas similares no período.</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-border/60 bg-muted/10 p-3 text-[11px] text-muted-foreground">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ranking da Meta (comparativo)</p>
        <div className="mt-2 space-y-1">
          <p><span className="text-foreground/80">Qualidade:</span> {qualityMeta.hint}</p>
          <p><span className="text-foreground/80">Engajamento:</span> {engagementMeta.hint}</p>
          <p><span className="text-foreground/80">Conversão:</span> {conversionMeta.hint}</p>
        </div>
        {campaign.objectiveMeta && (
          <p className="mt-1">
            Config Meta:{' '}
            {campaign.objectiveMeta.destinationType
              ? `destino ${formatDestinationLabel(campaign.objectiveMeta.destinationType)}`
              : 'destino —'}
            {campaign.objectiveMeta.optimizationGoal
              ? ` · otimização ${formatOptimizationLabel(campaign.objectiveMeta.optimizationGoal)}`
              : ' · otimização —'}
          </p>
        )}
        {benchmarkMessage && <p className="mt-1">{benchmarkMessage}</p>}
        <p className="mt-1 text-foreground/80">{insightMessage}</p>
      </div>
    </>
  );
}
