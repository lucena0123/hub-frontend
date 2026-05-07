import type { OpsBucket, OpsItem } from '../model';
import type { CheckpointState, ClientGroup } from './types';

export function buildGroupedByBucketClient(opsItems: OpsItem[], checkpointStateFor: (id: string) => CheckpointState): Record<OpsBucket, ClientGroup[]> {
  const group = (items: OpsItem[]) => {
    const map = new Map<string, ClientGroup>();
    items.forEach((item) => {
      const current = map.get(item.clientId) ?? { clientId: item.clientId, clientName: item.clientName, items: [] };
      current.items.push(item);
      map.set(item.clientId, current);
    });

    const priorityRank: Record<OpsItem['priority'], number> = { critical: 0, warning: 1, info: 2 };

    return Array.from(map.values())
      .map((grouped) => ({
        ...grouped,
        items: grouped.items.sort((a, b) => {
          const ac = checkpointStateFor(a.id);
          const bc = checkpointStateFor(b.id);
          if (ac.ready48 !== bc.ready48) return ac.ready48 ? -1 : 1;
          if (ac.ready24 !== bc.ready24) return ac.ready24 ? -1 : 1;
          if (priorityRank[a.priority] !== priorityRank[b.priority]) return priorityRank[a.priority] - priorityRank[b.priority];
          return a.title.localeCompare(b.title, 'pt-BR');
        }),
      }))
      .sort((a, b) => a.clientName.localeCompare(b.clientName, 'pt-BR'));
  };

  return {
    creative_copy: group(opsItems.filter((item) => item.bucket === 'creative_copy')),
    audience: group(opsItems.filter((item) => item.bucket === 'audience')),
    budget_scale: group(opsItems.filter((item) => item.bucket === 'budget_scale')),
  };
}
