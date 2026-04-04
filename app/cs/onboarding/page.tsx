'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ClipboardCheck, RefreshCw, ShieldPlus } from 'lucide-react';

import { listOnboarding, updateOnboardingTask, type OnboardingPlan } from '@/lib/api/client';
import { getApiErrorMessage } from '@/lib/api/client/error';
import { PageShell } from '@/components/layout/page-shell';
import { Reveal } from '@/components/layout/reveal';
import { SectionHeader } from '@/components/performance/section-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

const statusClass: Record<OnboardingPlan['status'], string> = {
  onboarding: 'bg-primary/15 text-primary',
  healthy: 'bg-emerald-500/15 text-emerald-300',
  risk: 'bg-destructive/15 text-destructive',
  renewal: 'bg-amber-500/15 text-amber-300',
  churned: 'bg-muted text-muted-foreground',
};

export default function CustomerSuccessOnboardingPage() {
  const [plans, setPlans] = useState<OnboardingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await listOnboarding();
      setPlans(data);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao carregar onboarding'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPlans();
  }, []);

  const summary = useMemo(() => ({
    total: plans.length,
    pendingTasks: plans.flatMap((plan) => plan.tasks).filter((task) => task.status !== 'done').length,
    healthy: plans.filter((plan) => plan.status === 'healthy').length,
  }), [plans]);

  const handleToggleTask = async (taskId: string, nextStatus: 'pending' | 'done') => {
    try {
      setBusyTaskId(taskId);
      await updateOnboardingTask(taskId, { status: nextStatus });
      await loadPlans();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao atualizar tarefa de onboarding'));
    } finally {
      setBusyTaskId(null);
    }
  };

  return (
    <PageShell
      breadcrumb={[{ label: 'Agência', href: '/' }, { label: 'Customer Success' }, { label: 'Onboarding' }]}
      title="Onboarding de Contas"
      description="A Onda 3 começa no contrato ativo e acompanha a primeira semana crítica de operação."
      meta={(
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="signal-chip">Planos {summary.total}</div>
          <div className="signal-chip">Pendências {summary.pendingTasks}</div>
          <div className="signal-chip">Saudáveis {summary.healthy}</div>
        </div>
      )}
      actions={(
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/cs/portfolio">Portfolio</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => void loadPlans()} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      )}
    >
      <div className="space-y-8">
        {error && (
          <Reveal>
            <div className="edge-card border border-destructive/40 bg-destructive/10 p-4 text-sm">{error}</div>
          </Reveal>
        )}

        <SectionHeader
          title="Planos em execução"
          subtitle="Checklist inicial por cliente para garantir handoff consistente."
          icon={ClipboardCheck}
        />

        <Reveal delayMs={80}>
          {loading ? (
            <div className="edge-card p-10 text-center text-sm text-muted-foreground">Carregando onboarding...</div>
          ) : plans.length === 0 ? (
            <div className="edge-card p-10 text-center text-sm text-muted-foreground">Nenhum onboarding criado ainda.</div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => (
                <div key={plan.id} className="edge-card hover-lift p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={statusClass[plan.status]}>{plan.status}</Badge>
                        <Badge variant="outline">{plan.contract.title}</Badge>
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{plan.client.name}</p>
                        <p className="text-sm text-muted-foreground">Meta de conclusão {formatDate(plan.targetDate, 'dd/MM/yyyy', 'Sem data')}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/clients/${plan.clientId}`}>Cliente</Link>
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {plan.tasks.map((task) => (
                      <div key={task.id} className="rounded-[2px] border border-border/60 bg-card/30 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{task.title}</p>
                            <p className="text-xs text-muted-foreground">Prazo {formatDate(task.dueDate, 'dd/MM/yyyy', 'Sem data')}</p>
                          </div>
                          <Button
                            variant={task.status === 'done' ? 'outline' : 'default'}
                            size="sm"
                            onClick={() => void handleToggleTask(task.id, task.status === 'done' ? 'pending' : 'done')}
                            disabled={busyTaskId === task.id}
                          >
                            {task.status === 'done' ? 'Reabrir' : 'Concluir'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Reveal>

        <Reveal delayMs={120}>
          <div className="edge-card p-4 text-xs text-muted-foreground">
            <div className="flex items-start gap-3">
              <ShieldPlus className="mt-0.5 h-4 w-4 text-emerald-400" />
              <p>CS assume onboarding, saúde e retenção. Financeiro continua responsável por contrato, cobrança e termos comerciais.</p>
            </div>
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}
