'use client';

import { SectionHeader } from '@/components/performance/section-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  bucketMeta,
  type OpsBucket,
  type OpsItem,
  type OpsStatus,
  type StatusHistoryEntry,
} from '../model';
import { MetaOpsItemCard, type MetaOpsCheckpointState, type MetaOpsRuleView } from './meta-ops-item-card';

type ClientGroup = {
  clientId: string;
  clientName: string;
  items: OpsItem[];
};

interface MetaOpsBucketsProps {
  groupedByBucketClient: Record<OpsBucket, ClientGroup[]>;
  collapsedClientGroup: Record<string, boolean>;
  statusMap: Record<string, OpsStatus>;
  statusHistoryMap: Record<string, StatusHistoryEntry[]>;
  rollbackByItem: Record<string, unknown>;
  clientFilter: string;
  savingRuleItemId: string | null;
  copiedKey: string | null;
  checkpointStateFor: (id: string) => MetaOpsCheckpointState;
  validationView: (id: string, status: OpsStatus) => {
    implementedAtLabel: string;
    checkpoint24: string;
    checkpoint48: string;
    nextCheckpoint: string;
  };
  currentRuleParams: (item: OpsItem) => MetaOpsRuleView;
  onToggleClientGroup: (key: string) => void;
  onCopyField: (key: string, text: string) => void;
  onApplyRuleSuggestion: (item: OpsItem) => void;
  onRollbackRuleSuggestion: (item: OpsItem) => void;
  onSetItemStatus: (id: string, status: OpsStatus) => void;
  hasImplementationTimestamp: (id: string) => boolean;
}

export function MetaOpsBuckets({
  groupedByBucketClient,
  collapsedClientGroup,
  statusMap,
  statusHistoryMap,
  rollbackByItem,
  clientFilter,
  savingRuleItemId,
  copiedKey,
  checkpointStateFor,
  validationView,
  currentRuleParams,
  onToggleClientGroup,
  onCopyField,
  onApplyRuleSuggestion,
  onRollbackRuleSuggestion,
  onSetItemStatus,
  hasImplementationTimestamp,
}: MetaOpsBucketsProps) {
  return (
    <>
      {(Object.keys(bucketMeta) as OpsBucket[]).map((bucket) => {
        const Icon = bucketMeta[bucket].icon;
        const groups = groupedByBucketClient[bucket];

        return (
          <div key={bucket} className="space-y-3">
            <SectionHeader
              title={bucketMeta[bucket].title}
              subtitle="Sugestões agrupadas por tipo de implementação"
              icon={Icon}
            />

            {groups.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">Sem itens neste grupo para o filtro atual.</CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {groups.map((group) => {
                  const groupKey = `${bucket}:${group.clientId}`;
                  const isCollapsed = collapsedClientGroup[groupKey] ?? false;

                  return (
                    <Card key={groupKey} className="border-primary/20">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-sm">Cliente: {group.clientName}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Itens {group.items.length}</Badge>
                            <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => onToggleClientGroup(groupKey)}>
                              {isCollapsed ? 'Mostrar' : 'Ocultar'}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {isCollapsed ? (
                          <div className="text-xs text-muted-foreground">Grupo oculto para reduzir ruído visual.</div>
                        ) : group.items.map((item) => (
                          <MetaOpsItemCard
                            key={item.id}
                            item={item}
                            status={statusMap[item.id] ?? 'pendente'}
                            statusHistory={statusHistoryMap[item.id] ?? []}
                            hasRollback={Boolean(rollbackByItem[item.id])}
                            clientFilter={clientFilter}
                            savingRuleItemId={savingRuleItemId}
                            copiedKey={copiedKey}
                            checkpointState={checkpointStateFor(item.id)}
                            validationView={validationView}
                            currentRuleParams={currentRuleParams}
                            onCopyField={onCopyField}
                            onApplyRuleSuggestion={onApplyRuleSuggestion}
                            onRollbackRuleSuggestion={onRollbackRuleSuggestion}
                            onSetItemStatus={onSetItemStatus}
                            hasImplementationTimestamp={hasImplementationTimestamp}
                          />
                        ))}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
