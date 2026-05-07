import { useMemo } from 'react';

import type { ActionProposal } from '@/lib/api/client';
import type { Client, PerformanceAlert } from '@/types';
import type { CheckpointFilter, OpsItem, OpsStatus } from './model';
import {
  buildGroupedByBucketClient,
  buildMandatoryByClient,
  buildMandatoryValidationToday,
  buildOpsItems,
  buildStatusMetrics,
  type CheckpointState,
} from './view-model-builders';

interface UseMetaOpsViewModelParams {
  alerts: PerformanceAlert[];
  proposals: ActionProposal[];
  clients: Client[];
  clientFilter: string;
  priorityFilter: 'all' | OpsItem['priority'];
  confidenceFilter: 'all' | OpsItem['confidence'];
  statusFilter: 'all' | OpsStatus;
  checkpointFilter: CheckpointFilter;
  statusMap: Record<string, OpsStatus>;
  checkpointStateFor: (id: string) => CheckpointState;
}

export function useMetaOpsViewModel({
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
}: UseMetaOpsViewModelParams) {
  const opsItems = useMemo<OpsItem[]>(() => buildOpsItems({
    alerts,
    checkpointFilter,
    checkpointStateFor,
    clientFilter,
    clients,
    confidenceFilter,
    priorityFilter,
    proposals,
    statusFilter,
    statusMap,
  }), [alerts, proposals, clients, clientFilter, priorityFilter, confidenceFilter, statusFilter, checkpointFilter, statusMap, checkpointStateFor]);

  const groupedByBucketClient = useMemo(
    () => buildGroupedByBucketClient(opsItems, checkpointStateFor),
    [opsItems, checkpointStateFor],
  );

  const statusMetrics = useMemo(
    () => buildStatusMetrics(opsItems, statusMap),
    [opsItems, statusMap],
  );

  const mandatoryValidationToday = useMemo(
    () => buildMandatoryValidationToday(opsItems, statusMap, checkpointStateFor),
    [opsItems, statusMap, checkpointStateFor],
  );

  const mandatoryByClient = useMemo(
    () => buildMandatoryByClient(mandatoryValidationToday, checkpointStateFor),
    [mandatoryValidationToday, checkpointStateFor],
  );

  return {
    opsItems,
    groupedByBucketClient,
    statusMetrics,
    mandatoryValidationToday,
    mandatoryByClient,
  };
}
