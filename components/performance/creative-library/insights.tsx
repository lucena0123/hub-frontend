'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CreativeLibraryInsights } from '@/types';

import { formatCta, formatCurrency, formatNumber } from './formatters';

export const CreativeLibraryInsightsPanel = (props: { insights?: CreativeLibraryInsights | null }) => {
  const insights = props.insights ?? null;
  if (!insights) return null;

  const hasAny = insights.topCtas.length > 0 || insights.topHeadlines.length > 0;
  if (!hasAny) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">CTAs que mais geram conversas</CardTitle>
          <CardDescription>Baseado nos melhores criativos do período</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {insights.topCtas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados.</p>
          ) : (
            insights.topCtas.map((item) => (
              <div key={item.ctaType} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{formatCta(item.ctaType) ?? item.ctaType}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(item.conversations)} conversas · CPL {formatCurrency(item.cpl)}
                  </p>
                </div>
                <Badge variant="outline">{formatCurrency(item.spend)}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Títulos que mais geram conversas</CardTitle>
          <CardDescription>Use como referência para novas variações</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {insights.topHeadlines.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados.</p>
          ) : (
            insights.topHeadlines.map((item) => (
              <div key={item.headline} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.headline}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(item.conversations)} conversas · CPL {formatCurrency(item.cpl)}
                  </p>
                </div>
                <Badge variant="outline">{formatCurrency(item.spend)}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

