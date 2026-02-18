'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, AlertOctagon, Terminal } from 'lucide-react';
import { getAlerts } from '@/lib/api/client';
import type { AlertsResponse } from '@/types';
import { AlertCard } from '@/components/alerts/alert-card';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/layout/page-shell';
import { Reveal } from '@/components/layout/reveal';
import { SectionHeader } from '@/components/performance/section-header';

const categories = [
  { value: 'all', label: 'TODOS' },
  { value: 'contacts', label: 'Contatos' },
  { value: 'qualification', label: 'Qualificação' },
  { value: 'trend', label: 'Tendência' },
  { value: 'stalled', label: 'Sem entrega' },
  { value: 'sync', label: 'Sincronização' },
  { value: 'budget', label: 'Orçamento' },
  { value: 'roas', label: 'ROAS' },
  { value: 'ctr', label: 'CTR' },
  { value: 'cpl', label: 'CPL' },
  { value: 'conversions', label: 'Conversões' },
  { value: 'bpmn', label: 'BPMN' },
];

export default function AlertsPage() {
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true);
        const response = await getAlerts();
        setData(response);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, []);

  const filteredAlerts = useMemo(() => {
    if (!data) return [];
    if (category === 'all') return data.alerts;
    return data.alerts.filter((alert) => alert.category === category);
  }, [data, category]);

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase">Varredura de alertas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="edge-card w-full max-w-md p-6 text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm text-destructive uppercase tracking-[0.2em]">Falha no sistema</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <PageShell
      eyebrow="Monitoramento / Alertas"
      title="Sala de Incidentes"
      description="Leituras críticas de performance e compliance com prioridade de ação."
      meta={
        data ? (
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="signal-chip">Críticos {data.critical}</div>
            <div className="signal-chip">Alertas {data.warning}</div>
            <div className="signal-chip">Total {data.total}</div>
          </div>
        ) : null
      }
    >
      <div className="space-y-8">
        <SectionHeader
          title="Resumo de Incidentes"
          subtitle="Distribuição de alertas críticos e operacionais."
          icon={AlertTriangle}
        />

        {data && (
          <Reveal>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.6fr)]">
              <div className="edge-card hover-lift p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Críticos</p>
                  <p className="text-3xl font-semibold text-destructive">{data.critical}</p>
                </div>
                <AlertOctagon className="h-6 w-6 text-destructive" />
              </div>
              <div className="edge-card hover-lift p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Atenção</p>
                  <p className="text-3xl font-semibold text-amber-400">{data.warning}</p>
                </div>
                <AlertTriangle className="h-6 w-6 text-amber-400" />
              </div>
              <div className="edge-card hover-lift p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Total</p>
                  <p className="text-3xl font-semibold">{data.total}</p>
                </div>
                <Terminal className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Reveal>
        )}

        <SectionHeader
          title="Filtros de Alerta"
          subtitle="Selecione o subsistema para investigação."
          icon={Terminal}
        />

        <Reveal delayMs={80}>
          <div className="edge-card p-3 overflow-x-auto">
            <div className="flex gap-1">
              {categories.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setCategory(item.value)}
                  className={cn(
                    "px-4 py-2 rounded-[2px] text-[11px] font-semibold uppercase tracking-[0.2em] transition-all border shrink-0 hover-lift",
                    category === item.value
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-card/30 border-border/50 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={160}>
          {filteredAlerts.length === 0 ? (
            <div className="edge-card p-12 text-center text-muted-foreground">
              Nenhum alerta para este filtro.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert, index) => (
                <div key={alert.id} className="relative pl-6">
                  <div className="absolute left-2 top-0 bottom-0 w-[1px] bg-border/50" />
                  <div className={cn(
                    "absolute left-0 top-6 h-2 w-2 rounded-full",
                    index % 2 === 0 ? "bg-primary" : "bg-emerald-500"
                  )} />
                  <AlertCard alert={alert} />
                </div>
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </PageShell>
  );
}
