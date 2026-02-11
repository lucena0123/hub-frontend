import { CheckCircle2, Circle, AlertTriangle, Clock } from 'lucide-react';
import type { BPMNProgress } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const steps = [
  { id: '4.1', label: '4.1 Setup de Ads' },
  { id: '4.2', label: '4.2 Config. campanha' },
  { id: '4.3', label: '4.3 Landing page' },
  { id: '5.1', label: '5.1 Monitoramento' },
  { id: '5.2', label: '5.2 Otimização' },
  { id: '5.3', label: '5.3 Testes A/B' },
];

const statusLabels = {
  not_started: 'Não iniciado',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  blocked: 'Bloqueado',
};

const statusColors = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-primary/10 text-primary',
  completed: 'bg-emerald-500/10 text-emerald-300',
  blocked: 'bg-destructive/10 text-destructive',
};

interface BpmnProgressTrackerProps {
  progress?: BPMNProgress | null;
}

export function BpmnProgressTracker({ progress }: BpmnProgressTrackerProps) {
  const currentIndex = progress
    ? steps.findIndex((step) => step.id === progress.currentSubprocess)
    : -1;

  const percent = progress?.progressPercentage ?? 0;
  const status = progress?.status ?? 'not_started';
  const pendingTasks = progress?.pendingTasks ?? [];

  return (
    <Card className="edge-card border-l-2 border-l-primary">
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div>
          <CardTitle className="text-base">Progresso BPMN</CardTitle>
          <p className="text-sm text-muted-foreground">Subprocesso 4.x a 5.x</p>
        </div>
        <Badge className={cn('capitalize', statusColors[status])}>
          {statusLabels[status]}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Progresso</span>
            <span className="font-medium">{percent}%</span>
          </div>
          <div className="mt-2 h-2.5 w-full rounded-full bg-muted">
            <div
              className={cn(
                'h-2.5 rounded-full transition-all duration-500',
                percent >= 80 ? 'bg-emerald-500' : percent >= 40 ? 'bg-primary' : 'bg-amber-500'
              )}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Subprocesso atual: {progress?.currentSubprocess ?? 'N/A'}
          </p>
        </div>

        <div className="grid gap-3">
          {steps.map((step, index) => {
            const isCompleted = progress?.completedTasks?.includes(step.id) || index < currentIndex;
            const isActive = index === currentIndex;

            return (
              <div key={step.id} className="flex items-center gap-3">
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : isActive ? (
                  status === 'blocked' ? (
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-primary" />
                  )
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <p className={cn('text-sm', isActive && 'font-semibold')}>
                    {step.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-[2px] border border-primary/20 bg-primary/10 p-3 text-sm">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Tarefas pendentes</p>
          {pendingTasks.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">Nenhuma tarefa pendente.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {pendingTasks.slice(0, 6).map((task) => (
                <li key={task}>- {task}</li>
              ))}
            </ul>
          )}
        </div>

        {progress?.blockers && progress.blockers.length > 0 && (
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-700">
            <p className="text-[11px] font-medium uppercase tracking-wider">Bloqueios</p>
            <ul className="mt-2 space-y-1">
              {progress.blockers.map((blocker) => (
                <li key={blocker.id}>
                  {blocker.severity.toUpperCase()}: {blocker.description}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
