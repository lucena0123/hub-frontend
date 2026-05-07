import { Wand2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle } from '@/components/ui/card';
import type { OptimizationCenterResponse } from '@/types';
import type { Tab } from './constants';

interface DiagnosticsPanelHeaderProps {
  tab: Tab;
  summary: OptimizationCenterResponse['summary'] | null;
  theme: OptimizationCenterResponse['theme'] | null;
  playbookVersion?: string | null;
  pendingCount: number;
  generating: boolean;
  hasClient: boolean;
  onTabChange: (tab: Tab) => void;
  onGenerate: () => void;
}

export function DiagnosticsPanelHeader({
  tab,
  summary,
  theme,
  playbookVersion,
  pendingCount,
  generating,
  hasClient,
  onTabChange,
  onGenerate,
}: DiagnosticsPanelHeaderProps) {
  return (
    <CardHeader className="pb-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-base flex items-center gap-2">
          Diagnóstico & Ações
          {theme && (
            <Badge variant="outline" className="text-xs font-normal">
              {theme.themeName} · v{playbookVersion ?? '?'}
            </Badge>
          )}
        </CardTitle>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerate}
            disabled={generating || !hasClient}
          >
            <Wand2 className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
            Gerar propostas
          </Button>
        </div>
      </div>

      <div className="flex gap-1 mt-2">
        <Button
          variant={tab === 'recommendations' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onTabChange('recommendations')}
          className="text-xs"
        >
          Recomendações
          {summary && (
            <Badge variant="secondary" className="ml-1.5 text-[10px]">
              {summary.total}
            </Badge>
          )}
        </Button>
        <Button
          variant={tab === 'queue' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onTabChange('queue')}
          className="text-xs"
        >
          Fila de Aprovação
          {pendingCount > 0 && (
            <Badge className="ml-1.5 text-[10px] bg-amber-500 text-white">
              {pendingCount}
            </Badge>
          )}
        </Button>
        <Button
          variant={tab === 'history' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onTabChange('history')}
          className="text-xs"
        >
          Histórico
        </Button>
      </div>
    </CardHeader>
  );
}
