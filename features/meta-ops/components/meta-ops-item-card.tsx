'use client';

import { Copy } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  confidenceClass,
  learningBasisLabel,
  priorityClass,
  statusClass,
  statusLabel,
  type OpsItem,
  type OpsStatus,
  type StatusHistoryEntry,
} from '../model';
import { MetaOpsItemActions } from './meta-ops-item-actions';
import { MetaOpsRuleSuggestion } from './meta-ops-rule-suggestion';

export type MetaOpsCheckpointState = {
  ready24: boolean;
  ready48: boolean;
  pending: boolean;
};

export type MetaOpsRuleView = {
  ruleId: string;
  current: Record<string, unknown>;
  suggested: Record<string, unknown>;
  rationale: string;
};

interface MetaOpsItemCardProps {
  item: OpsItem;
  status: OpsStatus;
  statusHistory: StatusHistoryEntry[];
  hasRollback: boolean;
  clientFilter: string;
  savingRuleItemId: string | null;
  copiedKey: string | null;
  checkpointState: MetaOpsCheckpointState;
  validationView: (id: string, status: OpsStatus) => {
    implementedAtLabel: string;
    checkpoint24: string;
    checkpoint48: string;
    nextCheckpoint: string;
  };
  currentRuleParams: (item: OpsItem) => MetaOpsRuleView;
  onCopyField: (key: string, text: string) => void;
  onApplyRuleSuggestion: (item: OpsItem) => void;
  onRollbackRuleSuggestion: (item: OpsItem) => void;
  onSetItemStatus: (id: string, status: OpsStatus) => void;
  hasImplementationTimestamp: (id: string) => boolean;
}

export function MetaOpsItemCard({
  item,
  status,
  statusHistory,
  hasRollback,
  clientFilter,
  savingRuleItemId,
  copiedKey,
  checkpointState,
  validationView,
  currentRuleParams,
  onCopyField,
  onApplyRuleSuggestion,
  onRollbackRuleSuggestion,
  onSetItemStatus,
  hasImplementationTimestamp,
}: MetaOpsItemCardProps) {
  const checkpointBadge = checkpointState.ready48 ? 'Pronto 48h' : checkpointState.ready24 ? 'Pronto 24h' : 'Checkpoint pendente';
  const checkpointClass = checkpointState.ready48
    ? 'border-emerald-500/40 bg-emerald-500/5'
    : checkpointState.ready24
      ? 'border-amber-500/40 bg-amber-500/5'
      : 'border-border/50 bg-card/40';
  const validation = validationView(item.id, status);
  const ruleView = currentRuleParams(item);

  return (
    <div id={`card-${item.id.replace(':', '-')}`} className={`rounded-md border ${checkpointClass} p-3 space-y-2`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-medium">{item.title}</div>
        <div className="flex items-center gap-2">
          <Badge className={priorityClass[item.priority]}>{item.priority}</Badge>
          <Badge className={confidenceClass[item.confidence]}>confiança {item.confidence}</Badge>
          <Badge className={statusClass[status]}>{statusLabel[status]}</Badge>
          <Badge variant="outline">{checkpointBadge}</Badge>
          <Badge variant="outline">{item.source === 'alert' ? 'Alerta' : 'Proposta'}</Badge>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <Badge variant="outline">Campanha: {item.campaignName}</Badge>
        <Badge variant="outline">Criativo: {item.creativeName}</Badge>
        <Badge variant="outline">{learningBasisLabel[item.learningWindowBasis ?? 'unknown']}</Badge>
      </div>

      <p className="text-xs text-muted-foreground">{item.description}</p>
      <div className="rounded-md border border-border/50 bg-background/60 p-2 text-[11px] text-muted-foreground space-y-1">
        <p><strong className="text-foreground/80">Evidência principal:</strong> {item.evidence}</p>
        {item.relatedEvidence.length > 1 ? (
          <p><strong className="text-foreground/80">Evidências relacionadas:</strong> {item.relatedEvidence.length - 1}</p>
        ) : null}
        <p><strong className="text-foreground/80">Janela de análise:</strong> {item.analysisWindow}</p>
        <p><strong className="text-foreground/80">Janela de aprendizado:</strong> {item.learningWindow}</p>
        <p><strong className="text-foreground/80">Critério de sucesso:</strong> {item.successCriterion}</p>
        <p><strong className="text-foreground/80">Próximo checkpoint:</strong> {validation.nextCheckpoint}</p>
      </div>

      <div className="rounded-md border border-border/50 bg-muted/20 p-2 text-[11px] text-muted-foreground space-y-1">
        <p><strong className="text-foreground/80">Validação 24h:</strong> {validation.checkpoint24}</p>
        <p><strong className="text-foreground/80">Validação 48h:</strong> {validation.checkpoint48}</p>
        <p><strong className="text-foreground/80">Implementação:</strong> {validation.implementedAtLabel}</p>
      </div>

      <div className="rounded-md border border-border/50 bg-muted/20 p-2 text-[11px] text-muted-foreground space-y-1">
        <p><strong className="text-foreground/80">Trilha de status (recente):</strong></p>
        {statusHistory.length === 0 ? (
          <p>Sem movimentação registrada ainda.</p>
        ) : (
          <ul className="space-y-1">
            {statusHistory.slice().reverse().map((entry, index) => (
              <li key={`${item.id}:history:${index}`}>• {statusLabel[entry.status]} — {new Date(entry.at).toLocaleString('pt-BR')}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-2 text-[11px]">
        <CopyBlock title="Copy (copia e cola)" copyKey={`${item.id}:copy`} text={item.copyText} copiedKey={copiedKey} onCopyField={onCopyField} preWrap />
        <CopyBlock title="Imagem/Vídeo sugerido" copyKey={`${item.id}:image`} text={item.imageSuggestion} copiedKey={copiedKey} onCopyField={onCopyField} />
        <CopyBlock title="Público sugerido" copyKey={`${item.id}:audience`} text={item.audienceSuggestion} copiedKey={copiedKey} onCopyField={onCopyField} />
        <CopyBlock title="Orçamento sugerido" copyKey={`${item.id}:budget`} text={item.budgetSuggestion} copiedKey={copiedKey} onCopyField={onCopyField} />
      </div>

      <MetaOpsRuleSuggestion
        clientFilter={clientFilter}
        hasRollback={hasRollback}
        item={item}
        onApplyRuleSuggestion={onApplyRuleSuggestion}
        onRollbackRuleSuggestion={onRollbackRuleSuggestion}
        ruleView={ruleView}
        savingRuleItemId={savingRuleItemId}
      />

      <MetaOpsItemActions
        hasImplementationTimestamp={hasImplementationTimestamp}
        item={item}
        onSetItemStatus={onSetItemStatus}
      />
    </div>
  );
}

function CopyBlock({
  title,
  copyKey,
  text,
  copiedKey,
  onCopyField,
  preWrap = false,
}: {
  title: string;
  copyKey: string;
  text: string;
  copiedKey: string | null;
  onCopyField: (key: string, text: string) => void;
  preWrap?: boolean;
}) {
  return (
    <div className="rounded-md border border-border/50 bg-muted/20 p-2 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-foreground/90">{title}</p>
        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => void onCopyField(copyKey, text)}>
          <Copy className="h-3 w-3 mr-1" /> {copiedKey === copyKey ? 'Copiado' : 'Copiar'}
        </Button>
      </div>
      <p className={preWrap ? 'text-muted-foreground whitespace-pre-wrap' : 'text-muted-foreground'}>{text}</p>
    </div>
  );
}
