import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';
import type { CommercialDashboard } from '@/lib/api/client/commercial';

type KpiRange = 'all' | 7 | 30;

type ExecutiveFunnelMetrics = {
  primeiroContato: number;
  diagnostico: number;
  proposta: number;
  negociacao: number;
  fechado: number;
  taxaFechamento: number;
  taxaDiagToProposta: number;
  taxaPropostaToFechado: number;
};

type OperationalBottlenecks = {
  blocked: number;
  inconsistent: number;
};

export function KpiChip({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/30 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={cn('text-xl font-semibold mt-1', accent)}>{value}</p>
    </div>
  );
}

export function FunnelBar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary/70 rounded-full funnel-bar-fill"
          style={{ '--bar-width': `${pct}%` } as CSSProperties}
        />
      </div>
    </div>
  );
}

export function PipelineKpiSection({
  kpis,
  kpiRange,
  onKpiRangeChange,
}: {
  kpis: CommercialDashboard;
  kpiRange: KpiRange;
  onKpiRangeChange: (range: KpiRange) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">KPIs do Pipeline</p>
        <select
          aria-label="Período dos KPIs"
          className="h-7 rounded-lg border border-input bg-transparent px-2 text-xs cursor-pointer"
          value={kpiRange}
          onChange={(e) => onKpiRangeChange(e.target.value === 'all' ? 'all' : (Number(e.target.value) as 7 | 30))}
        >
          <option value="all">Todo período</option>
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
        </select>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiChip label="Total" value={kpis.total} />
        <KpiChip label="Novos" value={kpis.novos} />
        <KpiChip label="Diagnósticos" value={kpis.diagnosticos} />
        <KpiChip label="Propostas" value={kpis.propostas} />
        <KpiChip label="Fechados" value={kpis.fechados} accent="text-emerald-300" />
      </div>
    </section>
  );
}

export function ExecutiveFunnelSection({
  executiveFunnel,
  totalLeads,
  operationalBottlenecks,
}: {
  executiveFunnel: ExecutiveFunnelMetrics;
  totalLeads: number;
  operationalBottlenecks: OperationalBottlenecks;
}) {
  return (
    <section className="rounded-2xl border border-border/50 bg-card/20 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Resumo Executivo</p>
        <span className="text-xs text-muted-foreground">
          Fechamento: <strong className="text-foreground">{executiveFunnel.taxaFechamento.toFixed(1)}%</strong>
        </span>
      </div>
      <div className="space-y-2">
        <FunnelBar label="1º Contato" value={executiveFunnel.primeiroContato} total={totalLeads} />
        <FunnelBar label="Diagnóstico" value={executiveFunnel.diagnostico} total={totalLeads} />
        <FunnelBar label="Proposta" value={executiveFunnel.proposta} total={totalLeads} />
        <FunnelBar label="Negociação" value={executiveFunnel.negociacao} total={totalLeads} />
        <FunnelBar label="Fechado" value={executiveFunnel.fechado} total={totalLeads} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="rounded-lg border border-border/40 bg-background/20 px-2 py-1.5">
          Diag → Proposta <strong>{executiveFunnel.taxaDiagToProposta.toFixed(1)}%</strong>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/20 px-2 py-1.5">
          Proposta → Fechado <strong>{executiveFunnel.taxaPropostaToFechado.toFixed(1)}%</strong>
        </div>
        <div className={cn('rounded-lg border px-2 py-1.5', operationalBottlenecks.blocked > 0 ? 'border-amber-500/40 bg-amber-500/10' : 'border-border/40 bg-background/20')}>
          Bloqueados <strong>{operationalBottlenecks.blocked}</strong>
        </div>
        <div className={cn('rounded-lg border px-2 py-1.5', operationalBottlenecks.inconsistent > 0 ? 'border-rose-500/40 bg-rose-500/10' : 'border-border/40 bg-background/20')}>
          Inconsistentes <strong>{operationalBottlenecks.inconsistent}</strong>
        </div>
      </div>
    </section>
  );
}
