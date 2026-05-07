import { Wand2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { ActionHistoryItem } from '@/types';

import {
  actionIconMap,
  actionLabelMap,
  buildHistorySummary,
  executionStatusClass,
  executionStatusLabel,
} from './constants';

export function HistoryItem({ item }: { item: ActionHistoryItem }) {
  const actionKey = item.action ?? '';
  const ActionIcon = actionIconMap[actionKey] ?? Wand2;
  const actionLabel = actionLabelMap[actionKey] ?? item.action ?? 'Ação executada';
  const statusKey = String(item.status || '').toLowerCase();
  const statusClass = executionStatusClass[statusKey] ?? 'border-slate-200 bg-slate-50 text-slate-700';
  const statusText = executionStatusLabel[statusKey] ?? item.status;
  const summary = buildHistorySummary(item);
  const entityLabel = item.entity?.name ?? item.entity?.id ?? null;

  return (
    <div className="rounded-[2px] border p-3 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={`text-[10px] ${statusClass}`}>
          {statusText}
        </Badge>
        <Badge variant="outline" className="text-[10px] flex items-center gap-1">
          <ActionIcon className="h-3 w-3" />
          {actionLabel}
        </Badge>
        {item.dryRun && (
          <Badge variant="outline" className="text-[10px]">
            dry-run
          </Badge>
        )}
        {entityLabel && (
          <span className="text-xs text-muted-foreground truncate max-w-[320px]">
            {entityLabel}
          </span>
        )}
      </div>
      {item.title && <p className="text-sm font-medium">{item.title}</p>}
      {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
      {summary && <p className="text-xs text-muted-foreground">{summary}</p>}
      {item.error && (
        <p className="text-xs text-rose-700">
          Erro: {item.error.message}
        </p>
      )}
      <p className="text-[10px] text-muted-foreground">
        {item.completedAt
          ? `Executado em ${formatDate(item.completedAt, 'dd/MM/yyyy HH:mm', '—')}`
          : `Criado em ${formatDate(item.createdAt, 'dd/MM/yyyy HH:mm', '—')}`}
        {item.executedBy?.type ? ` · origem: ${item.executedBy.type}` : ''}
      </p>
    </div>
  );
}
