'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trophy, Copy, Check, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCreativeWinners, type CreativeWinnerPattern } from '@/lib/api/client';

interface WinnerLibraryProps {
  clientId: string;
}

export function WinnerLibrary({ clientId }: WinnerLibraryProps) {
  const [winners, setWinners] = useState<CreativeWinnerPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCreativeWinners(clientId, { period: '90d', limit: '20' });
      setWinners(res.winners);
    } catch {
      setWinners([]);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (winners.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <Trophy className="h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">Nenhum criativo winner encontrado nos últimos 90 dias.</p>
          <p className="text-xs mt-1">Winners precisam de no mínimo R$100 de gasto e 5 conversas.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Trophy className="h-4 w-4 text-amber-500" />
        <span>{winners.length} padrões de copy vencedores (últimos 90 dias)</span>
      </div>

      <div className="grid gap-3">
        {winners.map((w, idx) => (
          <Card key={idx} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm truncate">
                      {w.headline || '(sem headline)'}
                    </h3>
                    {w.ctaType && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {w.ctaType.replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </div>

                  {w.primaryText && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {w.primaryText}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {w.totalConversations} conversas
                    </span>
                    <span>
                      CPL: {w.cpl != null ? formatCurrency(w.cpl) : '-'}
                    </span>
                    <span className="text-muted-foreground">
                      Gasto: {formatCurrency(w.totalSpend)}
                    </span>
                    {w.variantCount > 1 && (
                      <span className="text-muted-foreground">
                        {w.variantCount} variações
                      </span>
                    )}
                  </div>

                  {w.campaigns.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {w.campaigns.slice(0, 3).map((c, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">
                          {c.length > 30 ? c.slice(0, 30) + '...' : c}
                        </Badge>
                      ))}
                      {w.campaigns.length > 3 && (
                        <Badge variant="secondary" className="text-[10px]">
                          +{w.campaigns.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => handleCopy(
                    `Headline: ${w.headline || ''}\nPrimary Text: ${w.primaryText || ''}\nCTA: ${w.ctaType || ''}`,
                    idx
                  )}
                >
                  {copiedIdx === idx ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
