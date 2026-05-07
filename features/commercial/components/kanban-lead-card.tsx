'use client';

import { CalendarDays, AlertCircle } from 'lucide-react';

import { CommercialLead, CommercialLeadStatus } from '@/lib/api/client/commercial';
import { cn } from '@/lib/utils';
import { COLUMNS, NEXT_STATUS } from '@/features/commercial/hooks/use-comercial';

interface KanbanLeadCardProps {
  getAdvanceGuard: (lead: CommercialLead, target: CommercialLeadStatus) => { ok: boolean; reason?: string };
  hasInconsistency: boolean;
  isBlocked: boolean;
  lead: CommercialLead;
  onDragEnd: () => void;
  onDragStart: () => void;
  onMove: (to: CommercialLeadStatus) => void;
  onSelect: () => void;
  onSetError: (msg: string) => void;
  saving: boolean;
  selected: boolean;
}

export function KanbanLeadCard({
  lead,
  selected,
  saving,
  isBlocked,
  hasInconsistency,
  getAdvanceGuard,
  onSelect,
  onMove,
  onSetError,
  onDragStart,
  onDragEnd,
}: KanbanLeadCardProps) {
  const next = NEXT_STATUS[lead.statusAtual];
  const guard = next ? getAdvanceGuard(lead, next) : null;

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', lead.leadId);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      className={cn(
        'rounded-xl border p-3 space-y-2 cursor-pointer transition-all duration-150',
        selected
          ? 'border-primary/60 bg-primary/8 shadow-[0_0_14px_rgba(79,140,255,0.15)]'
          : 'border-border/50 bg-background/50 hover:border-border hover:bg-background/80',
        isBlocked && 'border-amber-500/40',
        hasInconsistency && 'border-rose-500/40',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-tight">{lead.nomeEscritorio}</p>
        {(isBlocked || hasInconsistency) && (
          <AlertCircle className={cn('h-3.5 w-3.5 flex-shrink-0 mt-0.5', hasInconsistency ? 'text-rose-400' : 'text-amber-400')} />
        )}
      </div>

      {lead.nomeContato && (
        <p className="text-[11px] text-foreground/60 truncate">{lead.nomeContato}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70 bg-muted/20 px-1.5 py-0.5 rounded">
          {lead.origem}
        </span>
        <span className="text-[10px] text-muted-foreground/60 truncate">{lead.responsavel}</span>
      </div>

      {lead.statusAtual === 'diagnostico_agendado' && lead.dataDiagnostico && (
        <div className="flex items-center gap-1 text-[11px] text-blue-400">
          <CalendarDays className="h-3 w-3" />
          {new Date(lead.dataDiagnostico).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
        </div>
      )}

      {next && guard && (
        <button
          type="button"
          className={cn(
            'w-full h-7 rounded-lg border text-xs transition-colors',
            guard.ok
              ? 'border-primary/40 text-primary hover:bg-primary/10 cursor-pointer'
              : 'border-border/40 text-muted-foreground cursor-not-allowed opacity-50',
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (!guard.ok) {
              onSetError(guard.reason || 'Ação bloqueada.');
              return;
            }
            onMove(next);
          }}
          disabled={saving || !guard.ok}
          title={!guard.ok ? guard.reason : undefined}
        >
          → {COLUMNS.find((c) => c.key === next)?.label}
        </button>
      )}
    </article>
  );
}
