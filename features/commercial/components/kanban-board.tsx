'use client';

import { CommercialLead, CommercialLeadStatus } from '@/lib/api/client/commercial';
import { cn } from '@/lib/utils';
import { COLUMNS } from '@/features/commercial/hooks/use-comercial';
import { KanbanLeadCard } from './kanban-lead-card';

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
          <KanbanLeadCard
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
