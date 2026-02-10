'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { getAbTestSuggestions } from '@/lib/api/client';
import type { AbTestSuggestionsResponse, AbTestSuggestionCategory, AbTestTargetMetric } from '@/types';

type AbTestSuggestionsProps = {
  snapshotId: string;
  period: { start: string; end: string };
};

const categoryLabel: Record<AbTestSuggestionCategory, string> = {
  hook: 'Gancho',
  cta: 'CTA',
  format: 'Formato',
  visual: 'Visual',
};

const metricLabel: Record<AbTestTargetMetric, string> = {
  conversations: 'Conversas',
  ctr: 'CTR',
  cpl: 'CPL',
  hook_rate: 'Hook rate',
  hold_rate: 'Hold rate',
};

export function CreativeAbTestSuggestions({ snapshotId, period }: AbTestSuggestionsProps) {
  const [data, setData] = useState<AbTestSuggestionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!period.start || !period.end) return;
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getAbTestSuggestions(snapshotId, {
          startDate: period.start,
          endDate: period.end,
        });
        if (!active) return;
        setData(result);
      } catch (err) {
        if (!active) return;
        setData(null);
        setError(err instanceof Error ? err.message : 'Falha ao carregar sugestões.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [period.end, period.start, snapshotId]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Sugestões de testes A/B</p>
        {data?.cached && (
          <Badge variant="outline" className="text-[10px]">
            cache
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Carregando sugestões...
        </div>
      ) : error ? (
        <p className="mt-2 text-xs text-rose-600">{error}</p>
      ) : data && data.suggestions.length > 0 ? (
        <div className="mt-2 space-y-2">
          {data.suggestions.map((suggestion) => (
            <div key={suggestion.id} className="rounded-lg border p-3 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {categoryLabel[suggestion.category]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Métrica alvo: {metricLabel[suggestion.targetMetric]}
                </span>
              </div>
              <p className="text-sm font-medium">{suggestion.title}</p>
              <p className="text-xs text-muted-foreground">{suggestion.hypothesis}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Nenhuma sugestão disponível para este criativo.
        </p>
      )}
    </div>
  );
}
