import { cn } from '@/lib/utils';

export type StatusPillStatus =
  | 'critical'
  | 'warning'
  | 'healthy'
  | 'completed'
  | 'blocked'
  | 'pending'
  | 'info';

const config: Record<StatusPillStatus, { defaultLabel: string; className: string }> = {
  critical:  { defaultLabel: 'Crítico',   className: 'bg-destructive/10 text-destructive border-destructive/40' },
  warning:   { defaultLabel: 'Atenção',   className: 'bg-amber-500/10 text-amber-600 border-amber-500/40 dark:text-amber-400' },
  healthy:   { defaultLabel: 'Saudável',  className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/40 dark:text-emerald-400' },
  completed: { defaultLabel: 'Concluído', className: 'bg-primary/10 text-primary border-primary/40' },
  blocked:   { defaultLabel: 'Bloqueado', className: 'bg-orange-500/10 text-orange-600 border-orange-500/40 dark:text-orange-400' },
  pending:   { defaultLabel: 'Pendente',  className: 'bg-muted text-muted-foreground border-border' },
  info:      { defaultLabel: 'Info',      className: 'bg-primary/10 text-primary border-primary/40' },
};

interface StatusPillProps {
  status: StatusPillStatus;
  label?: string;
  className?: string;
}

export function StatusPill({ status, label, className }: StatusPillProps) {
  const cfg = config[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        cfg.className,
        className
      )}
    >
      {label ?? cfg.defaultLabel}
    </span>
  );
}
