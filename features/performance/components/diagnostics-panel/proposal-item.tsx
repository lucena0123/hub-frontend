import { Check, Wand2, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import type { ActionProposal, OptimizationCenterSeverity } from '@/types';

import {
  actionIconMap,
  actionLabelMap,
  severityColor,
  severityLabel,
  statusBadgeClass,
  statusLabel,
} from './constants';

export function ProposalItem({
  proposal,
  busy,
  reason,
  onReasonChange,
  onApprove,
  onReject,
  onExecute,
}: {
  proposal: ActionProposal;
  busy: boolean;
  reason: string;
  onReasonChange: (val: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onExecute: () => void;
}) {
  const ActionIcon = actionIconMap[proposal.action ?? ''] ?? Wand2;
  const actionLabel = actionLabelMap[proposal.action ?? ''] ?? proposal.action ?? '';

  return (
    <div className="rounded-[2px] border p-3 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className={`text-[10px] ${statusBadgeClass[proposal.status]}`}>
              {statusLabel[proposal.status]}
            </Badge>
            {proposal.severity && (
              <Badge
                variant="outline"
                className={`text-[10px] ${severityColor[proposal.severity as OptimizationCenterSeverity] ?? ''}`}
              >
                {severityLabel[proposal.severity as OptimizationCenterSeverity] ?? proposal.severity}
              </Badge>
            )}
            {proposal.action && (
              <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                <ActionIcon className="h-3 w-3" />
                {actionLabel}
              </Badge>
            )}
            {proposal.status === 'approved' && proposal.lastDecision?.decidedByUserId == null && (
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary">
                Auto-executado
              </Badge>
            )}
          </div>
          <p className="text-sm font-medium">{proposal.title ?? 'Proposta sem título'}</p>
          {proposal.description && (
            <p className="text-xs text-muted-foreground">{proposal.description}</p>
          )}
          <p className="text-[10px] text-muted-foreground">
            {formatDate(proposal.createdAt, 'dd/MM/yyyy HH:mm', '—')}
            {proposal.lastDecision && (
              <>
                {' · '}
                {proposal.lastDecision.decision === 'approved' ? 'aprovado' : 'rejeitado'}
                {proposal.lastDecision.reason ? `: ${proposal.lastDecision.reason}` : ''}
              </>
            )}
          </p>
        </div>

        {proposal.status === 'pending' && (
          <div className="flex flex-col gap-2 w-full sm:w-[280px]">
            <Input
              placeholder="Motivo (opcional)"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              className="h-7 text-xs"
            />
            <div className="flex items-center justify-end gap-1.5">
              <Button size="sm" variant="outline" onClick={onReject} disabled={busy} className="h-7 text-xs">
                <X className="h-3 w-3" /> Rejeitar
              </Button>
              <Button size="sm" onClick={onApprove} disabled={busy} className="h-7 text-xs">
                <Check className="h-3 w-3" /> Aprovar
              </Button>
            </div>
          </div>
        )}

        {proposal.status === 'approved' && (
          <Button variant="outline" size="sm" onClick={onExecute} disabled={busy} className="h-7 text-xs">
            <Wand2 className="h-3 w-3" /> Executar (dry-run)
          </Button>
        )}
      </div>
    </div>
  );
}
