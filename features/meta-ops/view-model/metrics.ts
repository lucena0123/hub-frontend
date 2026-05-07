import type { OpsItem, OpsStatus } from '../model';
import type { CheckpointState, MandatoryClientGroup } from './types';

export function buildStatusMetrics(opsItems: OpsItem[], statusMap: Record<string, OpsStatus>) {
  const counts: Record<OpsStatus, number> = {
    pendente: 0,
    em_execucao: 0,
    implementado: 0,
    validado_ganhou: 0,
    validado_neutro: 0,
    validado_piorou: 0,
  };

  opsItems.forEach((item) => {
    const status = statusMap[item.id] ?? 'pendente';
    counts[status] += 1;
  });

  return counts;
}

export function buildMandatoryValidationToday(
  opsItems: OpsItem[],
  statusMap: Record<string, OpsStatus>,
  checkpointStateFor: (id: string) => CheckpointState,
) {
  return opsItems
    .filter((item) => {
      const status = statusMap[item.id] ?? 'pendente';
      if (status === 'validado_ganhou' || status === 'validado_neutro' || status === 'validado_piorou') return false;
      const checkpoint = checkpointStateFor(item.id);
      return checkpoint.ready24 || checkpoint.ready48;
    })
    .sort((a, b) => {
      const aCheckpoint = checkpointStateFor(a.id);
      const bCheckpoint = checkpointStateFor(b.id);
      if (aCheckpoint.ready48 !== bCheckpoint.ready48) return aCheckpoint.ready48 ? -1 : 1;
      const priorityOrder = { critical: 0, warning: 1, info: 2 } as const;
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.clientName.localeCompare(b.clientName, 'pt-BR');
    })
    .slice(0, 10);
}

export function buildMandatoryByClient(
  mandatoryValidationToday: OpsItem[],
  checkpointStateFor: (id: string) => CheckpointState,
): MandatoryClientGroup[] {
  const map = new Map<string, MandatoryClientGroup>();

  mandatoryValidationToday.forEach((item) => {
    const checkpoint = checkpointStateFor(item.id);
    const current = map.get(item.clientId) ?? { clientId: item.clientId, clientName: item.clientName, total: 0, ready48: 0 };
    current.total += 1;
    if (checkpoint.ready48) current.ready48 += 1;
    map.set(item.clientId, current);
  });

  return Array.from(map.values()).sort((a, b) => b.total - a.total || a.clientName.localeCompare(b.clientName, 'pt-BR'));
}
