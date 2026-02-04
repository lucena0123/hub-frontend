'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { OptimizationCenterHighlight } from '@/types';

import { formatCpl, formatCta, formatCurrency } from './formatters';

const HighlightCard = (props: { title: string; badge: string; items: OptimizationCenterHighlight[] }) => {
  const { title, badge, items } = props;

  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            {title}
            <Badge variant="outline">{badge}</Badge>
          </CardTitle>
          <CardDescription>Sem dados.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          {title}
          <Badge variant="outline">{badge}</Badge>
        </CardTitle>
        <CardDescription>Top 3 do período</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.slice(0, 3).map((c) => {
          const thumbnailUrl = c.thumbnailUrl;
          const cta = formatCta(c.ctaType);
          return (
            <div key={c.snapshotId} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 flex-none overflow-hidden rounded-md border bg-muted">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt="Preview do criativo"
                      className="h-full w-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium truncate max-w-[240px]">{c.headline || 'Criativo'}</p>
                    {cta && <Badge variant="outline">{cta}</Badge>}
                    {c.isDynamic && <Badge variant="secondary">dynamic</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.conversations.toLocaleString('pt-BR')} conversas · CPL {formatCpl(c.cpl)}
                  </p>
                </div>
              </div>
              <Badge variant="outline">{formatCurrency(c.spend)}</Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export const OptimizationHighlights = (props: {
  winners: OptimizationCenterHighlight[];
  fatigued: OptimizationCenterHighlight[];
  losers: OptimizationCenterHighlight[];
}) => {
  const { winners, fatigued, losers } = props;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <HighlightCard title="Criativos vencedores" badge="winners" items={winners} />
      <HighlightCard title="Criativos em fadiga" badge="fadiga" items={fatigued} />
      <HighlightCard title="Criativos a pausar" badge="losers" items={losers} />
    </div>
  );
};

