'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { getCreativeBenchmark } from '@/lib/api/client';
import type { CreativeBenchmarkResponse } from '@/types';

type CreativeBenchmarkProps = {
  snapshotId: string;
  period: { start: string; end: string };
};

export function CreativeBenchmarkInsight({ snapshotId, period }: CreativeBenchmarkProps) {
  const [data, setData] = useState<CreativeBenchmarkResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!period.start || !period.end) return;
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getCreativeBenchmark(snapshotId, {
          startDate: period.start,
          endDate: period.end,
        });
        if (!active) return;
        setData(result);
      } catch (err) {
        if (!active) return;
        setData(null);
        setError(err instanceof Error ? err.message : 'Falha ao carregar benchmark.');
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
      <div className="flex items-center gap-2">
        <p className="text-xs font-medium text-muted-foreground">Benchmark interno</p>
        {data?.themeKey && (
          <Badge variant="outline" className="text-[10px]">
            tema {data.themeKey}
          </Badge>
        )}
      </div>
      {loading ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Carregando benchmark...
        </div>
      ) : error ? (
        <p className="mt-2 text-xs text-rose-600">{error}</p>
      ) : data ? (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-muted-foreground">
            Baseline {data.baselinePeriod.start} → {data.baselinePeriod.end}
          </p>
          {data.insights.slice(0, 2).map((insight) => (
            <p key={insight.code} className="text-sm">
              {insight.message}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">Benchmark não disponível.</p>
      )}
    </div>
  );
}
