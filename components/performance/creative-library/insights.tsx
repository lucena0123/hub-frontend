'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CreativeLibraryInsights } from '@/types';

import { formatCta, formatCurrency, formatNumber } from './formatters';

const MIN_ITEMS = 2;

export const CreativeLibraryInsightsPanel = (props: { insights?: CreativeLibraryInsights | null }) => {
  const insights = props.insights ?? null;
  if (!insights) return null;

  const hasCtas = insights.topCtas.length >= MIN_ITEMS;
  const hasHeadlines = insights.topHeadlines.length >= MIN_ITEMS;
  if (!hasCtas && !hasHeadlines) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {hasCtas && (
        <Card className="border-dashed border-l-4 border-l-violet-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Melhores botões de ação (CTA)</CardTitle>
            <CardDescription>
              Qual botão gera mais conversas pelo menor custo? Use o CTA com menor CPL nos próximos anúncios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.topCtas.map((item, idx) => (
              <div key={item.ctaType} className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground w-4">{idx + 1}.</span>
                  <div>
                    <p className="text-sm font-medium truncate">{formatCta(item.ctaType) ?? item.ctaType}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(item.conversations)} conversas · investido {formatCurrency(item.spend)}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-none">
                  <p className="text-sm font-semibold">{formatCurrency(item.cpl)}</p>
                  <p className="text-[10px] text-muted-foreground">por conversa</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {hasHeadlines && (
        <Card className="border-dashed border-l-4 border-l-violet-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Melhores títulos</CardTitle>
            <CardDescription>
              Quais títulos geram mais conversas? Use como referência ao criar novos anúncios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.topHeadlines.map((item, idx) => (
              <div key={item.headline} className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground w-4">{idx + 1}.</span>
                  <div>
                    <p className="text-sm font-medium truncate">{item.headline}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(item.conversations)} conversas · investido {formatCurrency(item.spend)}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-none">
                  <p className="text-sm font-semibold">{formatCurrency(item.cpl)}</p>
                  <p className="text-[10px] text-muted-foreground">por conversa</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

