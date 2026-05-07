import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

import { Button } from '@/components/ui/button';
import type { OptimizationCenterItem } from '@/types';
import { RecommendationItem } from './recommendation-item';

interface RecommendationsTabProps {
  focusItems: OptimizationCenterItem[];
  optimizationLoading?: boolean;
  prioritizedItems: OptimizationCenterItem[];
  setShowAll: Dispatch<SetStateAction<boolean>>;
  showAll: boolean;
  showInfo: boolean;
  toggleShowInfo: () => void;
}

export function RecommendationsTab({
  focusItems,
  optimizationLoading,
  prioritizedItems,
  setShowAll,
  showAll,
  showInfo,
  toggleShowInfo,
}: RecommendationsTabProps) {
  if (optimizationLoading) {
    return <p className="text-sm text-muted-foreground py-4">Carregando recomendações...</p>;
  }

  if (focusItems.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Nenhuma recomendação no período. Sincronize a Meta para gerar diagnósticos.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[2px] border border-border/60 bg-muted/20 p-2">
        <p className="text-[11px] text-muted-foreground">
          Modo foco operacional: exibindo {focusItems.length} {showAll ? 'itens' : 'prioridades'}.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleShowInfo}
            className="h-7 text-[10px]"
          >
            {showInfo ? 'Ocultar info' : 'Mostrar info'}
          </Button>
          {(showInfo ? prioritizedItems.length : prioritizedItems.filter((item) => item.severity !== 'info').length) > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll((previous) => !previous)}
              className="h-7 text-[10px]"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-3 w-3" /> Ver menos
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" /> Ver tudo
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {focusItems.map((item) => (
        <RecommendationItem key={item.id} item={item} />
      ))}
    </div>
  );
}
