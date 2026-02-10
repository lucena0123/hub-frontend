'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getZeroConversationsDiagnostic } from '@/lib/api/client';
import type { ZeroConversationsDiagnostic, ZeroConversationsSeverity } from '@/types';

type ZeroConversationsDialogProps = {
  clientId: string;
  campaignId: string;
  campaignName: string;
  period: { start: string; end: string };
  children: ReactNode;
};

const severityBadgeClass: Record<ZeroConversationsSeverity, string> = {
  critical: 'bg-rose-500 text-white',
  warning: 'bg-amber-400 text-amber-950',
  info: 'bg-slate-200 text-slate-700',
};

const severityLabel: Record<ZeroConversationsSeverity, string> = {
  critical: 'Crítico',
  warning: 'Atenção',
  info: 'Info',
};

const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;

export function ZeroConversationsDialog({
  clientId,
  campaignId,
  campaignName,
  period,
  children,
}: ZeroConversationsDialogProps) {
  const [open, setOpen] = useState(false);
  const [diagnostic, setDiagnostic] = useState<ZeroConversationsDiagnostic | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestKey = useMemo(
    () => `${campaignId}:${period.start}:${period.end}`,
    [campaignId, period.end, period.start]
  );

  useEffect(() => {
    if (!open) return;
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getZeroConversationsDiagnostic(clientId, {
          campaignId,
          startDate: period.start,
          endDate: period.end,
        });
        if (!active) return;
        setDiagnostic(data);
      } catch (err) {
        if (!active) return;
        setDiagnostic(null);
        setError(err instanceof Error ? err.message : 'Falha ao carregar diagnóstico.');
      } finally {
        if (active) setLoading(false);
      }
    };

    if (!diagnostic || diagnostic.entity.id !== campaignId || requestKey !== `${diagnostic.entity.id}:${diagnostic.period.start}:${diagnostic.period.end}`) {
      void load();
    }

    return () => {
      active = false;
    };
  }, [campaignId, clientId, diagnostic, open, period.end, period.start, requestKey]);

  const metrics = diagnostic?.metrics;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Diagnóstico: {campaignName}
          </DialogTitle>
          <DialogDescription>
            Período {period.start} → {period.end}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando diagnóstico...
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : diagnostic ? (
          <div className="space-y-3">
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium">Resumo do período</p>
              <p className="text-xs text-muted-foreground">
                Gasto {formatCurrency(metrics?.spend ?? 0)} · Impressões {metrics?.impressions ?? 0} · Cliques {metrics?.clicks ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">
                Conversas {metrics?.conversations ?? 0} · Leads {metrics?.leads ?? 0} · Conversões {metrics?.conversions ?? 0}
              </p>
              {diagnostic.objective && (
                <p className="text-xs text-muted-foreground">Objetivo: {diagnostic.objective}</p>
              )}
            </div>

            {diagnostic.causes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma causa encontrada para este período.
              </p>
            ) : (
              <div className="space-y-2">
                {diagnostic.causes.map((cause) => (
                  <div key={cause.code} className="rounded-lg border p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={severityBadgeClass[cause.severity]}>
                        {severityLabel[cause.severity]}
                      </Badge>
                      <span className="text-sm font-medium">{cause.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{cause.description}</p>
                    <p className="text-xs">
                      <span className="font-medium text-foreground">Ação:</span> {cause.action}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {!diagnostic.eligible && (
              <p className="text-xs text-muted-foreground">
                Este diagnóstico é exibido quando há gasto e nenhuma conversa registrada.
              </p>
            )}

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                Fechar
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum diagnóstico disponível.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
