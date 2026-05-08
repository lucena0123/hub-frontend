'use client';

import { useState } from 'react';
import { Pause, Play, DollarSign, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/ui/status-pill';
import { ExpandableSection } from '@/components/ui/expandable-section';
import { executeOptimizationAction } from '@/lib/api/optimization';
import type { Task } from '@/types';
import { cn } from '@/lib/utils';
import type { StatusPillStatus } from '@/components/ui/status-pill';

interface TaskDecisionCardProps {
  task: Task;
  onActionComplete: (message?: string) => void;
}

const severityMap: Record<string, { pillStatus: StatusPillStatus; borderClass: string }> = {
  critical: { pillStatus: 'critical', borderClass: 'border-l-destructive' },
  high:     { pillStatus: 'warning',  borderClass: 'border-l-amber-500' },
  medium:   { pillStatus: 'pending',  borderClass: 'border-l-border' },
  low:      { pillStatus: 'info',     borderClass: 'border-l-primary/50' },
};

const getActionIcon = (type?: string) => {
  switch (type) {
    case 'pause_ad':           return <Pause className="h-3.5 w-3.5" />;
    case 'resume_ad':          return <Play className="h-3.5 w-3.5" />;
    case 'set_adset_budget':
    case 'set_campaign_budget': return <DollarSign className="h-3.5 w-3.5" />;
    default:                   return <AlertTriangle className="h-3.5 w-3.5" />;
  }
};

const getActionLabel = (type?: string, amount?: number | string) => {
  switch (type) {
    case 'pause_ad':            return 'Pausar anúncio';
    case 'resume_ad':           return 'Retomar anúncio';
    case 'set_adset_budget':
    case 'set_campaign_budget': return `Ajustar orçamento${amount ? ` -> ${amount}` : ''}`;
    default:                    return 'Executar ação';
  }
};

export function TaskDecisionCard({ task, onActionComplete }: TaskDecisionCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const severity = task.input?.severity ?? 'medium';
  const { pillStatus, borderClass } = severityMap[severity] ?? severityMap.medium;
  const action = task.input?.autoAction;
  const isCompleted = task.status === 'completed';

  const handleAction = async () => {
    if (!action) return;
    try {
      setLoading(true);
      setError(null);
      await executeOptimizationAction({
        type: action.type,
        entityId: action.entityId,
        amount: action.amount,
        reason: task.name,
        accessToken: 'mock_token_from_frontend',
        adAccountId: 'act_mock_account',
        dryRun: true,
      });
      onActionComplete(`Ação executada: ${task.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao executar ação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 border-l-[3px] transition-colors',
        borderClass,
        isCompleted && 'opacity-60'
      )}
    >
      <div className="flex-1 min-w-0 space-y-2">
        {/* Row 1: name + client + severity */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground truncate flex-1 min-w-0">
            {task.name}
          </span>
          {task.clientName && (
            <span className="text-[11px] text-muted-foreground flex-shrink-0">
              {task.clientName}
            </span>
          )}
          <StatusPill status={pillStatus} className="flex-shrink-0" />
        </div>

        {/* Row 2: description expandable */}
        {task.input?.description && (
          <ExpandableSection title="Detalhes" defaultOpen={false}>
            {task.input.description}
          </ExpandableSection>
        )}

        {/* Row 3: error + actions */}
        {error && (
          <p className="text-[11px] text-destructive">{error}</p>
        )}

        <div className="flex items-center gap-2 pt-0.5">
          {action ? (
            <Button
              size="sm"
              variant={action.type === 'pause_ad' ? 'destructive' : 'default'}
              onClick={handleAction}
              disabled={loading || isCompleted}
              className="h-7 px-3 text-[11px] gap-1.5"
            >
              {loading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : getActionIcon(action.type)}
              {loading ? 'Executando...' : getActionLabel(action.type, action.amount)}
            </Button>
          ) : null}
          <button
            type="button"
            onClick={() => onActionComplete()}
            disabled={loading || isCompleted}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:pointer-events-none"
          >
            {isCompleted ? 'Concluído' : 'Ignorar'}
          </button>
        </div>
      </div>
    </div>
  );
}
