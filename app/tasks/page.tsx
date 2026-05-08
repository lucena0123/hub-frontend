'use client';

import { useEffect, useMemo, useState } from 'react';
import { getOptimizationTasks } from '@/lib/api/optimization';
import type { Task } from '@/types';
import { Activity, CheckCircle2 } from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusPill } from '@/components/ui/status-pill';
import { EmptyState } from '@/components/ui/empty-state';
import { TaskDecisionCard } from '@/components/dashboard/task-decision-card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const severityOrder = ['critical', 'high', 'medium', 'low'];

const severityLabel: Record<string, string> = {
  critical: 'Critico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Baixo',
};

const severityIconClass: Record<string, string> = {
  critical: 'text-destructive',
  high: 'text-amber-500 dark:text-amber-400',
  medium: 'text-muted-foreground',
  low: 'text-primary/70',
};

function SeverityGroup({
  severity,
  tasks,
  onActionComplete,
}: {
  severity: string;
  tasks: Task[];
  onActionComplete: (id: string, message?: string) => void;
}) {
  if (tasks.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={cn('text-[11px] font-bold uppercase tracking-[0.12em]', severityIconClass[severity])}>
          {severityLabel[severity] ?? severity}
        </span>
        <span className="text-[11px] font-semibold text-muted-foreground">({tasks.length})</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskDecisionCard
            key={task.id}
            task={task}
            onActionComplete={(message) => onActionComplete(task.id, message)}
          />
        ))}
      </div>
    </div>
  );
}

export default function OptimizationTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientFilter, setClientFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await getOptimizationTasks();
      setTasks(data);
    } catch {
      setErrorMessage('Falha ao carregar tarefas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const clientOptions = useMemo(
    () =>
      Array.from(new Set(tasks.map((t) => t.clientName).filter(Boolean) as string[])).sort((a, b) =>
        a.localeCompare(b, 'pt-BR')
      ),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (clientFilter !== 'all' && task.clientName !== clientFilter) return false;
      if (severityFilter !== 'all' && (task.input?.severity ?? 'medium') !== severityFilter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hay = `${task.name} ${task.input?.description ?? ''} ${task.clientName ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tasks, clientFilter, severityFilter, query]);

  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = { critical: [], high: [], medium: [], low: [] };
    for (const task of filteredTasks) {
      const sev = task.input?.severity ?? 'medium';
      const key = groups[sev] ? sev : 'medium';
      groups[key].push(task);
    }
    return groups;
  }, [filteredTasks]);

  const criticalCount = groupedTasks.critical.length;
  const hasActiveFilters = query.trim() !== '' || clientFilter !== 'all' || severityFilter !== 'all';

  const handleActionComplete = (taskId: string, message?: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (message) {
      setStatusMessage(message);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  return (
    <PageShell
      eyebrow="Operacoes"
      title="Central de Acoes"
      description="Fila de intervencoes automaticas e correcoes sugeridas."
      actions={
        <Button variant="outline" size="sm" onClick={fetchTasks} disabled={loading}>
          Atualizar
        </Button>
      }
      meta={
        <div className="flex flex-wrap gap-2">
          {criticalCount > 0 && (
            <StatusPill status="critical" label={`${criticalCount} critico${criticalCount !== 1 ? 's' : ''}`} />
          )}
          <StatusPill status="pending" label={`${filteredTasks.length} pendente${filteredTasks.length !== 1 ? 's' : ''}`} />
        </div>
      }
    >
      {/* Feedback banners */}
      {statusMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
          {statusMessage}
        </div>
      )}
      {errorMessage && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
          {errorMessage}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Buscar tarefa, descricao ou cliente..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 w-full sm:w-[260px]"
        />
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-card px-2 text-xs text-foreground cursor-pointer"
        >
          <option value="all">Todos os clientes</option>
          {clientOptions.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-card px-2 text-xs text-foreground cursor-pointer"
        >
          <option value="all">Todas severidades</option>
          <option value="critical">Critico</option>
          <option value="high">Alto</option>
          <option value="medium">Medio</option>
          <option value="low">Baixo</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Nenhuma tarefa pendente"
          description={
            hasActiveFilters
              ? 'Nenhuma tarefa encontrada para o filtro atual.'
              : 'Tudo em dia. Novas tarefas aparecem aqui automaticamente.'
          }
          action={
            hasActiveFilters
              ? {
                  label: 'Limpar filtros',
                  onClick: () => {
                    setQuery('');
                    setClientFilter('all');
                    setSeverityFilter('all');
                  },
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {severityOrder.map((sev) => (
            <SeverityGroup
              key={sev}
              severity={sev}
              tasks={groupedTasks[sev]}
              onActionComplete={handleActionComplete}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
