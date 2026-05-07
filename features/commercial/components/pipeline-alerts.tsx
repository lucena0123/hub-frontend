'use client';

import { Button } from '@/components/ui/button';
import type {
  CommercialDailySummary,
  CommercialDispatchHealthSummary,
  CommercialFollowupDue,
  CommercialLead,
  CommercialRetentionAlert,
} from '@/lib/api/client/commercial';

type CriticalPendency = {
  leadId: string;
  nomeEscritorio: string;
  reason: string;
  severity: number;
};

export function DailySummarySection({ dailySummary }: { dailySummary: CommercialDailySummary | null }) {
  if (!dailySummary) return null;

  return (
    <section className="rounded-2xl border border-border/50 bg-card/20 p-4 space-y-3">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Resumo Diário</p>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
        <div className="rounded-lg border border-border/40 bg-background/20 px-2 py-1.5">
          Novos <strong>{dailySummary.novosLeads}</strong>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/20 px-2 py-1.5">
          SLA &gt;24h <strong>{dailySummary.leadsAtrasadosSla24h}</strong>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/20 px-2 py-1.5">
          Proposta sem follow-up <strong>{dailySummary.propostasSemFollowup}</strong>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/20 px-2 py-1.5">
          Negociações abertas <strong>{dailySummary.negociacoesAbertas}</strong>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/20 px-2 py-1.5">
          Fechados hoje <strong>{dailySummary.fechadosHoje}</strong>
        </div>
      </div>
    </section>
  );
}

export function DispatchHealthSection({ dispatchHealth }: { dispatchHealth: CommercialDispatchHealthSummary | null }) {
  if (!dispatchHealth) return null;

  return (
    <section className="rounded-2xl border border-border/50 bg-card/20 p-4 space-y-3">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Saúde de Dispatch (7d)</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="rounded-lg border border-border/40 bg-background/20 px-2 py-1.5">
          Total <strong>{dispatchHealth.total}</strong>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/20 px-2 py-1.5">
          Sucesso <strong>{dispatchHealth.success}</strong>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/20 px-2 py-1.5">
          Falhas <strong>{dispatchHealth.failed}</strong>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/20 px-2 py-1.5">
          Taxa <strong>{dispatchHealth.successRate.toFixed(1)}%</strong>
        </div>
      </div>
    </section>
  );
}

export function RetentionDueSection({ retentionDue }: { retentionDue: CommercialRetentionAlert[] }) {
  if (retentionDue.length === 0) return null;

  return (
    <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
      <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">Retenção LGPD Vencida</p>
      <div className="space-y-1.5">
        {retentionDue.map((item) => (
          <div key={item.leadId} className="rounded-xl border border-border/40 bg-background/30 px-3 py-2">
            <p className="text-xs font-medium">{item.nomeEscritorio}</p>
            <p className="text-[11px] text-muted-foreground">Atraso: {item.daysOverdue} dia(s)</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CriticalPendenciesSection({
  criticalPendencies,
  leads,
  onSelectLead,
}: {
  criticalPendencies: CriticalPendency[];
  leads: CommercialLead[];
  onSelectLead: (lead: CommercialLead) => void;
}) {
  if (criticalPendencies.length === 0) return null;

  return (
    <section className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-rose-400/80">Pendências Críticas</p>
        <span className="text-xs text-muted-foreground">{criticalPendencies.length} prioridade(s)</span>
      </div>
      <div className="space-y-1.5">
        {criticalPendencies.map((item) => (
          <button
            key={item.leadId}
            type="button"
            className="w-full text-left rounded-xl border border-rose-500/20 bg-background/30 px-3 py-2 hover:bg-rose-500/10 transition-colors cursor-pointer"
            onClick={() => {
              const found = leads.find((lead) => lead.leadId === item.leadId);
              if (found) onSelectLead(found);
            }}
          >
            <p className="text-xs font-medium text-foreground">{item.nomeEscritorio}</p>
            <p className="text-[11px] text-muted-foreground">{item.reason}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

export function FollowupsDueSection({
  followupsDue,
  saving,
  onTriggerFollowup,
}: {
  followupsDue: CommercialFollowupDue[];
  saving: boolean;
  onTriggerFollowup: (leadId: string, followupType: 'D+2' | 'D+5') => void;
}) {
  if (followupsDue.length === 0) return null;

  return (
    <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
      <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">Follow-ups Vencidos ({followupsDue.length})</p>
      <div className="space-y-1.5">
        {followupsDue.map((item) => (
          <div key={`${item.leadId}-${item.followupType}`} className="flex items-center justify-between rounded-xl border border-border/40 bg-background/30 px-3 py-2">
            <div>
              <p className="text-xs font-medium">{item.nomeEscritorio}</p>
              <p className="text-[11px] text-muted-foreground">{item.followupType} · {new Date(item.dueAt).toLocaleString('pt-BR')}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 cursor-pointer"
              disabled={saving}
              onClick={() => onTriggerFollowup(item.leadId, item.followupType)}
            >
              Disparar
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
