'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';

import { PageShell } from '@/components/layout/page-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MandatoryValidationPanel } from '@/features/meta-ops/components/mandatory-validation-panel';
import { MetaOpsBuckets } from '@/features/meta-ops/components/meta-ops-buckets';
import { MetaOpsFilters } from '@/features/meta-ops/components/meta-ops-filters';
import {
  type CheckpointFilter,
  type OpsItem,
  type OpsStatus,
} from '@/features/meta-ops/model';
import { useMetaOpsActions } from '@/features/meta-ops/use-meta-ops-actions';
import { useMetaOpsData } from '@/features/meta-ops/use-meta-ops-data';
import { useMetaOpsPersistence } from '@/features/meta-ops/use-meta-ops-persistence';
import { useMetaOpsViewModel } from '@/features/meta-ops/use-meta-ops-view-model';

export default function MetaOpsPage() {
  const searchParams = useSearchParams();
  const {
    loading,
    error,
    clients,
    alerts,
    proposals,
    rulesByClient,
    setRulesByClient,
  } = useMetaOpsData();
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | OpsItem['priority']>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | OpsItem['confidence']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | OpsStatus>('all');
  const [checkpointFilter, setCheckpointFilter] = useState<CheckpointFilter>('all');
  const {
    statusMap,
    statusHistoryMap,
    collapsedClientGroup,
    rollbackByItem,
    ruleFeedback,
    setRollbackByItem,
    setRuleFeedback,
    checkpointStateFor,
    hasImplementationTimestamp,
    setItemStatus,
    validationView,
    toggleClientGroup,
  } = useMetaOpsPersistence();

  useEffect(() => {
    const qClient = searchParams.get('clientId');
    const qCheckpoint = searchParams.get('checkpoint');

    const timeout = window.setTimeout(() => {
      if (qClient) setClientFilter(qClient);
      if (qCheckpoint === 'mandatory' || qCheckpoint === 'ready24' || qCheckpoint === 'ready48' || qCheckpoint === 'pending') {
        setCheckpointFilter(qCheckpoint as CheckpointFilter);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [searchParams]);

  const {
    opsItems,
    groupedByBucketClient,
    statusMetrics,
    mandatoryValidationToday,
    mandatoryByClient,
  } = useMetaOpsViewModel({
    alerts,
    proposals,
    clients,
    clientFilter,
    priorityFilter,
    confidenceFilter,
    statusFilter,
    checkpointFilter,
    statusMap,
    checkpointStateFor,
  });
  const {
    savingRuleItemId,
    copiedKey,
    currentRuleParams,
    applyRuleSuggestion,
    rollbackRuleSuggestion,
    copyField,
  } = useMetaOpsActions({
    rulesByClient,
    rollbackByItem,
    setRulesByClient,
    setRollbackByItem,
    setRuleFeedback,
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <PageShell
      eyebrow="Meta Ads / Operação"
      title="Central de Implementação"
      description="Tela única com recomendações baseadas em evidência interna para executar no Meta Ads."
      meta={
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="signal-chip">Total {opsItems.length}</div>
          <div className="signal-chip">Pendentes {statusMetrics.pendente}</div>
          <div className="signal-chip">Em execução {statusMetrics.em_execucao}</div>
          <div className="signal-chip">Implementados {statusMetrics.implementado}</div>
          <div className="signal-chip">Validados ✅ {statusMetrics.validado_ganhou}</div>
          <div className="signal-chip">Validados ➖ {statusMetrics.validado_neutro}</div>
          <div className="signal-chip">Validados ⛔ {statusMetrics.validado_piorou}</div>
          <div className="signal-chip">Prontos 24h {opsItems.filter((i) => checkpointStateFor(i.id).ready24).length}</div>
          <div className="signal-chip">Prontos 48h {opsItems.filter((i) => checkpointStateFor(i.id).ready48).length}</div>
        </div>
      }
    >
      <div className="space-y-6">
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-sm">Como usar (assistido)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
            <div className="rounded-md border border-border/50 bg-muted/20 p-2">1) Filtre cliente e priorize itens críticos.</div>
            <div className="rounded-md border border-border/50 bg-muted/20 p-2">2) Abra a tela alvo (Performance/Board/Regras) e implemente no Meta Ads.</div>
            <div className="rounded-md border border-border/50 bg-muted/20 p-2">3) Marque como implementado e valide resultado em 24h e 48h.</div>
          </CardContent>
        </Card>

        {ruleFeedback ? (
          <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs">{ruleFeedback}</div>
        ) : null}

        <MandatoryValidationPanel
          items={mandatoryValidationToday}
          groups={mandatoryByClient}
          checkpointStateFor={checkpointStateFor}
          onCheckpointFilterChange={setCheckpointFilter}
        />

        <MetaOpsFilters
          clients={clients}
          clientFilter={clientFilter}
          priorityFilter={priorityFilter}
          confidenceFilter={confidenceFilter}
          statusFilter={statusFilter}
          checkpointFilter={checkpointFilter}
          onClientFilterChange={setClientFilter}
          onPriorityFilterChange={setPriorityFilter}
          onConfidenceFilterChange={setConfidenceFilter}
          onStatusFilterChange={setStatusFilter}
          onCheckpointFilterChange={setCheckpointFilter}
        />

        <MetaOpsBuckets
          groupedByBucketClient={groupedByBucketClient}
          collapsedClientGroup={collapsedClientGroup}
          statusMap={statusMap}
          statusHistoryMap={statusHistoryMap}
          rollbackByItem={rollbackByItem}
          clientFilter={clientFilter}
          savingRuleItemId={savingRuleItemId}
          copiedKey={copiedKey}
          checkpointStateFor={checkpointStateFor}
          validationView={validationView}
          currentRuleParams={currentRuleParams}
          onToggleClientGroup={toggleClientGroup}
          onCopyField={copyField}
          onApplyRuleSuggestion={applyRuleSuggestion}
          onRollbackRuleSuggestion={rollbackRuleSuggestion}
          onSetItemStatus={setItemStatus}
          hasImplementationTimestamp={hasImplementationTimestamp}
        />

        <div className="rounded-[12px] border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Esta central é assistida e orientada por evidência interna (alertas e propostas). Benchmark externo é apenas insumo, não decisão final.
        </div>
      </div>
    </PageShell>
  );
}
