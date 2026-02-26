'use client';

import { CommercialLead, CommercialLeadStatus } from '@/lib/api/client/commercial';
import { cn } from '@/lib/utils';
import { COLUMNS, NEXT_STATUS } from '../hooks/use-comercial';
import { CalendarDays, AlertCircle } from 'lucide-react';

interface KanbanBoardProps {
  leadsByStatus: Record<string, CommercialLead[]>;
  selectedLead: CommercialLead | null;
  draggingLeadId: string | null;
  hoverColumn: CommercialLeadStatus | null;
  saving: boolean;
  isLeadBlocked: (lead: CommercialLead) => boolean;
  hasOperationalInconsistency: (lead: CommercialLead) => boolean;
  getAdvanceGuard: (lead: CommercialLead, target: CommercialLeadStatus) => { ok: boolean; reason?: string };
  onSelectLead: (lead: CommercialLead) => void;
  onMoveLead: (lead: CommercialLead, to: CommercialLeadStatus) => void;
  onSetError: (msg: string) => void;
  onDragStart: (leadId: string) => void;
  onDragEnd: () => void;
  onDrop: (targetStatus: CommercialLeadStatus, leadId?: string) => void;
  onHoverColumn: (col: CommercialLeadStatus | null) => void;
}

const ACTIVE_COLUMNS = COLUMNS.filter((c) => c.key !== 'nutricao' && c.key !== 'perdido');
const EXIT_COLUMNS = COLUMNS.filter((c) => c.key === 'nutricao' || c.key === 'perdido');

function LeadCard({
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
}: {
  lead: CommercialLead;
  selected: boolean;
  saving: boolean;
  isBlocked: boolean;
  hasInconsistency: boolean;
  getAdvanceGuard: (lead: CommercialLead, target: CommercialLeadStatus) => { ok: boolean; reason?: string };
  onSelect: () => void;
  onMove: (to: CommercialLeadStatus) => void;
  onSetError: (msg: string) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const next = NEXT_STATUS[lead.statusAtual];
  const guard = next ? getAdvanceGuard(lead, next) : null;

  return (
    <article
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', lead.leadId); onDragStart(); }}
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
            if (!guard.ok) { onSetError(guard.reason || 'Ação bloqueada.'); return; }
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

function KanbanColumn({
  col,
  leads,
  selectedLead,
  hoverColumn,
  saving,
  isLeadBlocked,
  hasOperationalInconsistency,
  getAdvanceGuard,
  onSelectLead,
  onMoveLead,
  onSetError,
  onDragStart,
  onDragEnd,
  onDrop,
  onHoverColumn,
  accent = false,
}: {
  col: { key: CommercialLeadStatus; label: string };
  leads: CommercialLead[];
  selectedLead: CommercialLead | null;
  hoverColumn: CommercialLeadStatus | null;
  saving: boolean;
  isLeadBlocked: (l: CommercialLead) => boolean;
  hasOperationalInconsistency: (l: CommercialLead) => boolean;
  getAdvanceGuard: (l: CommercialLead, t: CommercialLeadStatus) => { ok: boolean; reason?: string };
  onSelectLead: (l: CommercialLead) => void;
  onMoveLead: (l: CommercialLead, to: CommercialLeadStatus) => void;
  onSetError: (msg: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (targetStatus: CommercialLeadStatus, leadId?: string) => void;
  onHoverColumn: (col: CommercialLeadStatus | null) => void;
  accent?: boolean;
}) {
  const isHovered = hoverColumn === col.key;

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); onHoverColumn(col.key); }}
      onDragLeave={() => onHoverColumn(null)}
      onDrop={async (e) => {
        e.preventDefault();
        await onDrop(col.key, e.dataTransfer.getData('text/plain') || undefined);
        onHoverColumn(null);
      }}
      className={cn(
        'kanban-column rounded-2xl border p-3 space-y-2 min-h-[180px] transition-colors',
        isHovered ? 'border-primary/50 bg-primary/5' : accent ? 'border-rose-500/20 bg-rose-500/5' : 'border-border/40 bg-card/20',
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className={cn(
          'text-[10px] uppercase tracking-[0.2em] font-medium',
          accent ? 'text-rose-400/70' : 'text-muted-foreground',
        )}>
          {col.label}
        </h3>
        <span className={cn(
          'text-[10px] rounded-full px-1.5 py-0.5',
          leads.length > 0 ? 'bg-primary/15 text-primary' : 'text-muted-foreground/50',
        )}>
          {leads.length}
        </span>
      </div>

      <div className="space-y-2">
        {leads.map((lead) => (
          <LeadCard
            key={lead.leadId}
            lead={lead}
            selected={selectedLead?.leadId === lead.leadId}
            saving={saving}
            isBlocked={isLeadBlocked(lead)}
            hasInconsistency={hasOperationalInconsistency(lead)}
            getAdvanceGuard={getAdvanceGuard}
            onSelect={() => onSelectLead(lead)}
            onMove={(to) => onMoveLead(lead, to)}
            onSetError={onSetError}
            onDragStart={() => onDragStart(lead.leadId)}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard(props: KanbanBoardProps) {
  const { leadsByStatus, ...rest } = props;

  return (
    <div className="space-y-4">
      {/* Active pipeline columns */}
      <div className="kanban-scroll">
        {ACTIVE_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.key}
            col={col}
            leads={leadsByStatus[col.key] || []}
            {...rest}
          />
        ))}
      </div>

      {/* Exit columns */}
      <div className="grid grid-cols-2 gap-3">
        {EXIT_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.key}
            col={col}
            leads={leadsByStatus[col.key] || []}
            accent
            {...rest}
          />
        ))}
      </div>
    </div>
  );
}
