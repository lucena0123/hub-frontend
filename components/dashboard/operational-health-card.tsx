import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/ui/status-pill';
import { cn } from '@/lib/utils';

type ClientSummary = {
  clientId: string;
  clientName: string;
  tier: string;
  status: string;
  healthScore: number | null;
  healthGrade: string | null;
  spend7d: number;
  spend30d: number;
  conversations7d: number;
  cpl7d: number | null;
  anomalyCount: number;
  pendingProposals: number;
};

const GRADE_BORDER: Record<string, string> = {
  A: 'border-l-emerald-500',
  B: 'border-l-primary',
  C: 'border-l-amber-500',
  D: 'border-l-orange-500',
  F: 'border-l-destructive',
};

const GRADE_TEXT: Record<string, string> = {
  A: 'text-emerald-600 dark:text-emerald-400',
  B: 'text-primary',
  C: 'text-amber-600 dark:text-amber-400',
  D: 'text-orange-600 dark:text-orange-400',
  F: 'text-destructive',
};

const TIER_CLASS: Record<string, string> = {
  premium: 'bg-primary/10 text-primary border-primary/40',
  enterprise: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/40',
  basic: 'bg-muted text-muted-foreground border-border',
  standard: 'bg-muted text-muted-foreground border-border',
};

interface OperationalHealthCardProps {
  client: ClientSummary;
}

export function OperationalHealthCard({ client }: OperationalHealthCardProps) {
  const grade = client.healthGrade ?? '-';
  const borderClass = GRADE_BORDER[grade] ?? 'border-l-border';
  const gradeTextClass = GRADE_TEXT[grade] ?? 'text-muted-foreground';
  const tierClass = TIER_CLASS[client.tier] ?? TIER_CLASS.basic;
  const hasCriticalIssue = client.anomalyCount > 0 || grade === 'F' || grade === 'D';

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 border-l-[3px] transition-colors hover:bg-muted/30',
        borderClass
      )}
    >
      {/* Grade */}
      <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-extrabold', grade !== '-' ? `border-current ${gradeTextClass}` : 'border-border text-muted-foreground')}>
        {grade}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Row 1: name + tier */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/clients/${client.clientId}/performance`}
            className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate"
          >
            {client.clientName}
          </Link>
          <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', tierClass)}>
            {client.tier}
          </span>
        </div>

        {/* Row 2: metrics summary */}
        <p className="text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">
            R${client.spend7d.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </span>
          {' '}7d
          {client.conversations7d > 0 && (
            <> · <span className="font-medium text-foreground">{client.conversations7d}</span> conv.</>
          )}
          {client.cpl7d != null && (
            <> · CPL <span className="font-medium text-foreground">R${client.cpl7d.toFixed(2)}</span></>
          )}
        </p>

        {/* Row 3: alerts (only when there are issues) */}
        {hasCriticalIssue && (
          <div className="flex flex-wrap gap-2">
            {client.anomalyCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-destructive">
                <AlertTriangle className="h-3 w-3" />
                {client.anomalyCount} anomalia{client.anomalyCount !== 1 ? 's' : ''}
              </span>
            )}
            {client.pendingProposals > 0 && (
              <span className="text-[11px] text-amber-600 dark:text-amber-400">
                {client.pendingProposals} proposta{client.pendingProposals !== 1 ? 's' : ''} pendente{client.pendingProposals !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Row 4: actions */}
        <div className="flex items-center gap-2 pt-0.5">
          <Button size="sm" asChild className="h-6 px-2.5 text-[11px]">
            <Link href={`/clients/${client.clientId}/performance`}>Performance</Link>
          </Button>
          <Link
            href={`/optimization/board?clientId=${client.clientId}`}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Board
          </Link>
        </div>
      </div>
    </div>
  );
}
