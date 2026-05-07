import { RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { ActionHistoryItem } from '@/types';
import { HistoryItem } from './history-item';

interface HistoryTabProps {
  historyError: string | null;
  historyItems: ActionHistoryItem[];
  historyLoading: boolean;
  historyRange: { startDate: string; endDate: string } | null;
  loadHistory: () => void;
  selectedCampaignId?: string | null;
}

export function HistoryTab({
  historyError,
  historyItems,
  historyLoading,
  historyRange,
  loadHistory,
  selectedCampaignId,
}: HistoryTabProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {selectedCampaignId ? 'Filtrado pela campanha selecionada.' : 'Mostrando todas as campanhas.'}
          {historyRange ? ` · ${historyRange.startDate} → ${historyRange.endDate}` : ''}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadHistory}
          disabled={historyLoading}
          className="text-xs"
        >
          <RefreshCw className={`h-3 w-3 ${historyLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {historyError && (
        <p className="text-sm text-destructive">{historyError}</p>
      )}

      {historyLoading ? (
        <p className="text-sm text-muted-foreground py-4">Carregando histórico...</p>
      ) : historyItems.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          Nenhuma ação executada encontrada no período.
        </p>
      ) : (
        <div className="space-y-2">
          {historyItems.map((item) => (
            <HistoryItem key={item.executionId} item={item} />
          ))}
        </div>
      )}
    </>
  );
}
