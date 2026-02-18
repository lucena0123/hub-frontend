'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProcesses } from '@/lib/api/client';
import type { ProcessInstance } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/layout/page-shell';
import { Reveal } from '@/components/layout/reveal';
import { SectionHeader } from '@/components/performance/section-header';

export default function ProcessesPage() {
  const [processes, setProcesses] = useState<ProcessInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);

  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        setLoading(true);
        const data = await getProcesses();
        setProcesses(data);
        setError(null);
        setLastRefreshAt(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch processes');
      } finally {
        setLoading(false);
      }
    };

    fetchProcesses();

    // Refresh every 15 seconds
    const interval = setInterval(fetchProcesses, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading && processes.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase">Carregando processos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="edge-card w-full max-w-md p-6 text-center space-y-3">
          <PlayCircle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm uppercase tracking-[0.2em] text-destructive">Falha no sistema</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const runningCount = processes.filter(p => p.status === 'running').length;
  const completedCount = processes.filter(p => p.status === 'completed').length;

  return (
    <PageShell
      eyebrow="Operações / Processos"
      title="Linha de Execução"
      description="Acompanhe instâncias críticas e progresso das automações em tempo real."
      meta={
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="signal-chip">Rodando {runningCount}</div>
          <div className="signal-chip">Concluídos {completedCount}</div>
        </div>
      }
    >
      <div className="space-y-8">
        <SectionHeader
          title="Resumo de Execução"
          subtitle="Indicadores rápidos do pipeline."
          icon={PlayCircle}
          action={(
            <Button variant="outline" size="sm" onClick={() => void (async () => {
              try {
                setLoading(true);
                const data = await getProcesses();
                setProcesses(data);
                setError(null);
                setLastRefreshAt(new Date());
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Falha ao atualizar processos');
              } finally {
                setLoading(false);
              }
            })()}>
              Atualizar
            </Button>
          )}
        />

        {lastRefreshAt && (
          <div className="rounded-[12px] border border-border/60 bg-card/40 p-3 text-xs text-muted-foreground">
            Última atualização: {lastRefreshAt.toLocaleString('pt-BR')}
          </div>
        )}

        <Reveal>
          <div className="flex flex-wrap gap-4">
            <div className="edge-card hover-lift p-4 flex items-center justify-between flex-[1_1_220px]">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Rodando</p>
                <p className="text-3xl font-semibold text-primary">{runningCount}</p>
              </div>
              <PlayCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="edge-card hover-lift p-4 flex items-center justify-between flex-[1_1_220px]">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Concluídos</p>
                <p className="text-3xl font-semibold text-emerald-400">{completedCount}</p>
              </div>
              <Activity className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </Reveal>

        <SectionHeader
          title="Instâncias em Andamento"
          subtitle="Status detalhado por cliente e processo."
          icon={Activity}
        />

        <Reveal delayMs={120}>
          {processes.length === 0 ? (
            <div className="edge-card p-8 text-center">
              <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase">Nenhuma instância ativa</p>
            </div>
          ) : (
            <div className="space-y-4">
              {processes.map((process) => (
                <div key={process.id} className="relative group edge-card hover-lift p-4 overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary/40 group-hover:bg-primary transition-colors" />
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 w-full">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Processo</p>
                        <p className="text-xs">{process.processId}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Cliente</p>
                        <p className="font-semibold text-sm truncate">{process.clientName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Status</p>
                        <Badge variant="outline" className={cn(
                          "border-0 bg-transparent px-0",
                          process.status === 'running' ? 'text-primary' :
                            process.status === 'completed' ? 'text-emerald-500' :
                              process.status === 'failed' ? 'text-destructive' : 'text-muted-foreground'
                        )}>
                          [{process.status.toUpperCase()}]
                        </Badge>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Progresso</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{process.progress}%</span>
                          <div className="h-1 flex-1 bg-secondary overflow-hidden">
                            <div
                              className={cn("h-full", process.status === 'completed' ? 'bg-emerald-500' : 'bg-primary')}
                              style={{ width: `${process.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <Button size="sm" variant="outline" asChild className="h-7 text-[10px]">
                        <Link href={`/clients/${process.clientId}`}>Cliente</Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild className="h-7 text-[10px]">
                        <Link href={`/clients/${process.clientId}/performance`}>Performance</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </PageShell>
  );
}
