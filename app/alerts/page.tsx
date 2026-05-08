'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertOctagon, AlertTriangle, Info } from 'lucide-react';
import { getAlerts } from '@/lib/api/client';
import type { AlertsResponse } from '@/types';
import { AlertCard } from '@/components/alerts/alert-card';
import { StatusPill } from '@/components/ui/status-pill';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/layout/page-shell';
import { Reveal } from '@/components/layout/reveal';

const categories = [
  { value: 'all', label: 'Todos' },
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

function SeveritySection({
  label,
  count,
  icon: Icon,
  iconClass,
  children,
}: {
  label: string;
  count: number;
  icon: React.ElementType;
  iconClass: string;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-3.5 w-3.5', iconClass)} aria-hidden="true" />
        <span className={cn('text-[11px] font-bold uppercase tracking-[0.12em]', iconClass)}>
          {label}
        </span>
        <span className="text-[11px] font-semibold text-muted-foreground">({count})</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

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

  const criticalAlerts = useMemo(
    () => filteredAlerts.filter((a) => a.type === 'critical'),
    [filteredAlerts]
  );
  const warningAlerts = useMemo(
    () => filteredAlerts.filter((a) => a.type === 'warning'),
    [filteredAlerts]
  );
  const infoAlerts = useMemo(
    () => filteredAlerts.filter((a) => a.type === 'info'),
    [filteredAlerts]
  );

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Activity className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground text-sm">Carregando alertas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-2 max-w-sm">
          <AlertOctagon className="h-6 w-6 text-destructive mx-auto" />
          <p className="text-sm font-semibold text-destructive">Falha ao carregar</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <PageShell
      eyebrow="Monitoramento"
      title="Central de Alertas"
      meta={
        data ? (
          <div className="flex flex-wrap gap-2">
            {data.critical > 0 && (
              <StatusPill status="critical" label={`${data.critical} crítico${data.critical !== 1 ? 's' : ''}`} />
            )}
            {data.warning > 0 && (
              <StatusPill status="warning" label={`${data.warning} atenção`} />
            )}
            {data.total > 0 && (
              <StatusPill status="pending" label={`${data.total} total`} />
            )}
          </div>
        ) : null
      }
    >
      {/* Filter bar */}
      <Reveal>
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-1.5 min-w-max">
            {categories.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setCategory(item.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border shrink-0 cursor-pointer',
                  category === item.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-border/80'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Alert list grouped by severity */}
      <Reveal delayMs={80}>
        {filteredAlerts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Activity className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">Nenhum alerta</p>
            <p className="text-xs text-muted-foreground mt-1">
              {category === 'all'
                ? 'Tudo operando normalmente.'
                : `Sem alertas na categoria "${categories.find((c) => c.value === category)?.label}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <SeveritySection
              label="Crítico"
              count={criticalAlerts.length}
              icon={AlertOctagon}
              iconClass="text-destructive"
            >
              {criticalAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </SeveritySection>

            <SeveritySection
              label="Atenção"
              count={warningAlerts.length}
              icon={AlertTriangle}
              iconClass="text-amber-500 dark:text-amber-400"
            >
              {warningAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </SeveritySection>

            <SeveritySection
              label="Info"
              count={infoAlerts.length}
              icon={Info}
              iconClass="text-primary"
            >
              {infoAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </SeveritySection>
          </div>
        )}
      </Reveal>
    </PageShell>
  );
}
