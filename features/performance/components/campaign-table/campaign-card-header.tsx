import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ZeroConversationsDialog } from '@/components/performance/zero-conversations-dialog';
import type { PerformanceSummary } from '@/types';
import { formatObjectiveLabel } from './campaign-meta';

interface CampaignCardHeaderProps {
  campaign: PerformanceSummary;
  clientId: string;
  complianceBadge: { className: string; label: string } | null;
  complianceTooltip: string | null;
  isTopPriority: boolean;
  priorityMeta: { className: string; label: string };
  priorityScore: number;
  showZeroConversations: boolean;
}

const statusColors: Record<string, string> = {
  excellent: 'bg-emerald-500',
  good: 'bg-primary',
  fair: 'bg-yellow-500',
  poor: 'bg-rose-500',
};

export function CampaignCardHeader({
  campaign,
  clientId,
  complianceBadge,
  complianceTooltip,
  isTopPriority,
  priorityMeta,
  priorityScore,
  showZeroConversations,
}: CampaignCardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="space-y-1">
        <h4 className="text-base font-semibold leading-snug">
          {campaign.campaignName}
        </h4>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{campaign.platform}</span>
          {campaign.platform === 'meta' && (
            <Badge
              variant="outline"
              className={`text-[10px] px-1 py-0 h-5 ${
                campaign.objective
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-amber-400/40 bg-amber-400/10 text-amber-200'
              }`}
              title="Objetivo, destino e otimização sincronizados do Meta Ads."
            >
              {formatObjectiveLabel(campaign.objective, campaign.objectiveMeta)}
            </Badge>
          )}
          {campaign.budgetMode && campaign.budgetMode !== 'unknown' && (
            <Badge
              variant="outline"
              className={`text-[10px] px-1 py-0 h-5 ${campaign.budgetMode === 'abo'
                ? 'border-primary/30 bg-primary/10 text-primary'
                : campaign.budgetMode === 'cbo'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              }`}
              title="Origem do orçamento: ABO = por conjunto, CBO = por campanha."
            >
              {campaign.budgetMode.toUpperCase()}
            </Badge>
          )}
          <Badge
            className={statusColors[campaign.status] ?? 'bg-slate-500'}
            title="Status de performance calculado por CTR, CPL e ROAS."
          >
            {campaign.status}
          </Badge>
          {isTopPriority && (
            <Badge className="bg-rose-600 text-white text-[10px]" title="Card com maior prioridade operacional no cliente.">
              Ação imediata
            </Badge>
          )}
          <Badge
            className={`text-[10px] ${priorityMeta.className}`}
            title={`Score de prioridade: ${priorityScore}`}
          >
            {priorityMeta.label}
          </Badge>
          {complianceBadge && (
            <Badge
              className={`text-[10px] ${complianceBadge.className}`}
              title={complianceTooltip ?? 'Sinalização de risco de compliance no período.'}
            >
              {complianceBadge.label}
            </Badge>
          )}
        </div>
      </div>
      {showZeroConversations && (
        <ZeroConversationsDialog
          clientId={clientId}
          campaignId={campaign.campaignId}
          campaignName={campaign.campaignName}
          period={campaign.period}
        >
          <Button
            variant="outline"
            size="xs"
            className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
          >
            Sem conversas
          </Button>
        </ZeroConversationsDialog>
      )}
    </div>
  );
}
