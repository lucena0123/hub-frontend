'use client';

import { Button } from '@/components/ui/button';
import type { OpsItem } from '../model';
import type { MetaOpsRuleView } from './meta-ops-item-card';

interface MetaOpsRuleSuggestionProps {
  clientFilter: string;
  hasRollback: boolean;
  item: OpsItem;
  onApplyRuleSuggestion: (item: OpsItem) => void;
  onRollbackRuleSuggestion: (item: OpsItem) => void;
  ruleView: MetaOpsRuleView;
  savingRuleItemId: string | null;
}

export function MetaOpsRuleSuggestion({
  clientFilter,
  hasRollback,
  item,
  onApplyRuleSuggestion,
  onRollbackRuleSuggestion,
  ruleView,
  savingRuleItemId,
}: MetaOpsRuleSuggestionProps) {
  return (
    <div className="rounded-md border border-border/50 bg-background/60 p-2 text-[11px] space-y-2">
      <p className="font-medium text-foreground/90">Sugestão de atualização de regra ({ruleView.ruleId})</p>
      <p className="text-muted-foreground">{ruleView.rationale}</p>
      <p className="text-muted-foreground"><strong className="text-foreground/80">Atual:</strong> {JSON.stringify(ruleView.current)}</p>
      <p className="text-muted-foreground"><strong className="text-foreground/80">Sugerido:</strong> {JSON.stringify(ruleView.suggested)}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[10px]"
          disabled={savingRuleItemId === item.id || clientFilter === 'all'}
          onClick={() => void onApplyRuleSuggestion(item)}
        >
          Aplicar sugestão
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[10px]"
          disabled={savingRuleItemId === item.id || !hasRollback}
          onClick={() => void onRollbackRuleSuggestion(item)}
        >
          Rollback
        </Button>
      </div>
      {clientFilter === 'all' ? (
        <p className="text-[10px] text-amber-300">Selecione um cliente no filtro para habilitar aplicação de regra.</p>
      ) : null}
    </div>
  );
}
