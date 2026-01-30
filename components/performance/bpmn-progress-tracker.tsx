import { CheckCircle2, Circle, AlertTriangle, Clock } from 'lucide-react';
import type { BPMNProgress } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const steps = [
  { id: '4.1', label: '4.1 Ads setup' },
  { id: '4.2', label: '4.2 Campaign config' },
  { id: '4.3', label: '4.3 Landing page' },
  { id: '5.1', label: '5.1 Monitoring' },
  { id: '5.2', label: '5.2 Optimization' },
  { id: '5.3', label: '5.3 A/B tests' },
];

const statusLabels = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
  blocked: 'Blocked',
};

const statusColors = {
  not_started: 'bg-slate-200 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  blocked: 'bg-rose-100 text-rose-700',
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
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>BPMN progress</CardTitle>
          <p className="text-sm text-muted-foreground">Subprocess 4.x to 5.x</p>
        </div>
        <Badge className={cn('capitalize', statusColors[status])}>
          {statusLabels[status]}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{percent}%</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Current subprocess: {progress?.currentSubprocess ?? 'N/A'}
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
                    <Clock className="h-4 w-4 text-blue-500" />
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

        <div className="rounded-lg border bg-muted/40 p-3 text-sm">
          <p className="font-semibold">Pending tasks</p>
          {pendingTasks.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">No pending tasks.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {pendingTasks.slice(0, 6).map((task) => (
                <li key={task}>- {task}</li>
              ))}
            </ul>
          )}
        </div>

        {progress?.blockers && progress.blockers.length > 0 && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <p className="font-semibold">Blockers</p>
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
