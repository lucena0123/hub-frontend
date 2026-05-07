import type { ActionProposal } from '@/lib/api/client';
import type { Client, PerformanceAlert } from '@/types';
import {
  bucketFromAlert,
  bucketFromProposal,
  buildPlaybook,
  inferCreativeName,
  normalizeLearningWindowBasis,
  successCriterionByBucket,
  toPriority,
  windowsBySource,
  type CheckpointFilter,
  type OpsItem,
  type OpsStatus,
} from '../model';
import type { CheckpointState } from './types';

export function buildOpsItems(params: {
  alerts: PerformanceAlert[];
  checkpointFilter: CheckpointFilter;
  checkpointStateFor: (id: string) => CheckpointState;
  clientFilter: string;
  clients: Client[];
  confidenceFilter: 'all' | OpsItem['confidence'];
  priorityFilter: 'all' | OpsItem['priority'];
  proposals: ActionProposal[];
  statusFilter: 'all' | OpsStatus;
  statusMap: Record<string, OpsStatus>;
}) {
  const {
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
  } = params;
  const fromAlerts: OpsItem[] = alerts
    .filter((alert) => alert.type === 'critical' || alert.type === 'warning')
    .map((alert) => {
      const bucket = bucketFromAlert(alert);
      const priority = toPriority(alert.type);
      const campaignName = alert.campaignName ?? 'Campanha não identificada';
      const playbook = buildPlaybook({
        title: campaignName,
        priority,
        bucket,
        clientName: alert.clientName,
      });
      const windows = windowsBySource('alert', alert.message, bucket, {
        analysisWindow: alert.analysisWindow,
        learningWindow: alert.learningWindow,
        learningWindowBasis: normalizeLearningWindowBasis(alert.learningWindowBasis),
      });

      return {
        id: `alert:${alert.id}`,
        clientId: alert.clientId,
        clientName: alert.clientName,
        campaignName,
        creativeName: inferCreativeName(campaignName, alert.message),
        title: campaignName,
        description: alert.message,
        source: 'alert',
        priority,
        bucket,
        evidence: `${alert.metric}: atual ${alert.currentValue} vs referência ${alert.threshold}`,
        successCriterion: successCriterionByBucket(bucket),
        confidence: 'alta',
        relatedEvidence: [],
        ...windows,
        ...playbook,
      };
    });

  const fromProposals: OpsItem[] = proposals
    .filter((proposal) => proposal.status === 'pending' || proposal.status === 'approved')
    .map((proposal) => {
      const bucket = bucketFromProposal(proposal);
      const priority = toPriority(proposal.severity ?? 'info');
      const clientName = clients.find((client) => client.id === proposal.clientId)?.name ?? 'Cliente';
      const title = proposal.title ?? 'Ação proposta';
      const description = proposal.description ?? `Ação sugerida: ${proposal.action ?? 'review'}`;
      const playbook = buildPlaybook({ title, priority, bucket, clientName });
      const windows = windowsBySource('proposal', description, bucket);

      return {
        id: `proposal:${proposal.proposalId}`,
        clientId: proposal.clientId,
        clientName,
        campaignName: title,
        creativeName: inferCreativeName(title, description),
        title,
        description,
        source: 'proposal',
        priority,
        bucket,
        evidence: `Proposta ${proposal.status} em ${new Date(proposal.createdAt).toLocaleString('pt-BR')}`,
        successCriterion: successCriterionByBucket(bucket),
        confidence: proposal.status === 'approved' ? 'alta' : 'média',
        relatedEvidence: [],
        ...windows,
        ...playbook,
      };
    });

  const priorityWeight: Record<OpsItem['priority'], number> = { critical: 3, warning: 2, info: 1 };
  const confidenceWeight: Record<OpsItem['confidence'], number> = { alta: 2, média: 1 };
  const dedupedMap = new Map<string, OpsItem>();

  [...fromAlerts, ...fromProposals].forEach((item) => {
    const dedupeKey = [item.clientId, item.campaignName.toLowerCase(), item.bucket, item.priority].join('::');
    const existing = dedupedMap.get(dedupeKey);

    if (!existing) {
      dedupedMap.set(dedupeKey, { ...item, relatedEvidence: [...item.relatedEvidence] });
      return;
    }

    const existingScore = priorityWeight[existing.priority] * 10 + confidenceWeight[existing.confidence] + (existing.source === 'alert' ? 3 : 1);
    const incomingScore = priorityWeight[item.priority] * 10 + confidenceWeight[item.confidence] + (item.source === 'alert' ? 3 : 1);
    const mergedEvidence = Array.from(
      new Set([
        ...existing.relatedEvidence,
        `${existing.source === 'alert' ? 'Alerta' : 'Proposta'}: ${existing.evidence}`,
        `${item.source === 'alert' ? 'Alerta' : 'Proposta'}: ${item.evidence}`,
      ]),
    );

    if (incomingScore > existingScore) {
      dedupedMap.set(dedupeKey, { ...item, relatedEvidence: mergedEvidence });
    } else {
      dedupedMap.set(dedupeKey, { ...existing, relatedEvidence: mergedEvidence });
    }
  });

  return Array.from(dedupedMap.values())
    .filter((item) => clientFilter === 'all' || item.clientId === clientFilter)
    .filter((item) => priorityFilter === 'all' || item.priority === priorityFilter)
    .filter((item) => confidenceFilter === 'all' || item.confidence === confidenceFilter)
    .filter((item) => statusFilter === 'all' || (statusMap[item.id] ?? 'pendente') === statusFilter)
    .filter((item) => {
      if (checkpointFilter === 'all') return true;
      const checkpoint = checkpointStateFor(item.id);
      const status = statusMap[item.id] ?? 'pendente';

      if (checkpointFilter === 'ready24') return checkpoint.ready24;
      if (checkpointFilter === 'ready48') return checkpoint.ready48;
      if (checkpointFilter === 'mandatory') {
        const validated = status === 'validado_ganhou' || status === 'validado_neutro' || status === 'validado_piorou';
        return !validated && (checkpoint.ready24 || checkpoint.ready48);
      }

      return checkpoint.pending;
    })
    .sort((a, b) => {
      const priorityOrder = { critical: 0, warning: 1, info: 2 } as const;
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.clientName.localeCompare(b.clientName, 'pt-BR');
    });
}
