'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { X } from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { useAuth } from '@/contexts/auth-context';
import {
  CommercialDashboard,
  CommercialLead,
  CommercialLeadStatus,
  CommercialSlaAlert,
  CommercialDailySummary,
  CommercialLeadTimelineEvent,
  CommercialFollowupDue,
  createCommercialLead,
  getCommercialDashboard,
  getCommercialDailySummary,
  getCommercialFollowupsDue,
  getCommercialLeadTimeline,
  getCommercialLeads,
  getCommercialSlaAlerts,
  moveCommercialLead,
  submitCommercialForm,
  updateCommercialLeadOnboarding,
  updateCommercialLeadPrivacy,
  updateCommercialLeadProofs,
} from '@/lib/api/client/commercial';

const COLUMNS: Array<{ key: CommercialLeadStatus; label: string }> = [
  { key: 'novo_lead', label: 'Novo Lead' },
  { key: 'primeiro_contato', label: '1º Contato' },
  { key: 'diagnostico_agendado', label: 'Diag. Agendado' },
  { key: 'diagnostico_concluido', label: 'Diag. Concluído' },
  { key: 'proposta_enviada', label: 'Proposta' },
  { key: 'negociacao', label: 'Negociação' },
  { key: 'fechado', label: 'Fechado' },
  { key: 'nutricao', label: 'Nutrição' },
  { key: 'perdido', label: 'Perdido' },
];

const NEXT_STATUS: Partial<Record<CommercialLeadStatus, CommercialLeadStatus>> = {
  novo_lead: 'primeiro_contato',
  primeiro_contato: 'diagnostico_agendado',
  diagnostico_agendado: 'diagnostico_concluido',
  diagnostico_concluido: 'proposta_enviada',
  proposta_enviada: 'negociacao',
  negociacao: 'fechado',
};

type PendingTransition = {
  lead: CommercialLead;
  to: 'nutricao' | 'perdido';
};

const NURTURE_REASONS = [
  'Sem urgência no momento',
  'Aguardando decisão interna',
  'Aguardando retorno do sócio',
  'Momento financeiro inadequado',
  'Contato sem resposta temporária',
] as const;

const LOSS_REASONS = [
  'Sem orçamento',
  'Fechou com concorrente',
  'Sem fit de perfil',
  'Sem retorno após follow-up',
  'Projeto adiado/cancelado',
] as const;

const getApiErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof AxiosError) {
    const payload = err.response?.data as { message?: string } | undefined;
    if (payload?.message) return payload.message;
  }
  return fallback;
};

export default function ComercialPage() {
  const { user } = useAuth();
  const canManageSensitive = user?.role === 'admin' || user?.role === 'manager';

  const [leads, setLeads] = useState<CommercialLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kpis, setKpis] = useState<CommercialDashboard>({ total: 0, novos: 0, diagnosticos: 0, propostas: 0, fechados: 0 });
  const [slaAlerts, setSlaAlerts] = useState<CommercialSlaAlert[]>([]);
  const [dailySummary, setDailySummary] = useState<CommercialDailySummary | null>(null);
  const [timeline, setTimeline] = useState<CommercialLeadTimelineEvent[]>([]);
  const [followupsDue, setFollowupsDue] = useState<CommercialFollowupDue[]>([]);
  const [nomeEscritorio, setNomeEscritorio] = useState('');
  const [origem, setOrigem] = useState<'instagram' | 'indicacao' | 'site' | 'whatsapp' | 'outro'>('instagram');
  const [responsavel, setResponsavel] = useState('Matheus');
  const [search, setSearch] = useState('');
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [origemFilter, setOrigemFilter] = useState<'all' | 'instagram' | 'indicacao' | 'site' | 'whatsapp' | 'outro'>('all');
  const [responsavelFilter, setResponsavelFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CommercialLeadStatus>('all');
  const [kpiRange, setKpiRange] = useState<'all' | 7 | 30>('all');
  const [sortBy, setSortBy] = useState<'updated_desc' | 'name_asc'>('updated_desc');
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [selectedLead, setSelectedLead] = useState<CommercialLead | null>(null);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [hoverColumn, setHoverColumn] = useState<CommercialLeadStatus | null>(null);
  const [pendingTransition, setPendingTransition] = useState<PendingTransition | null>(null);
  const [transitionReason, setTransitionReason] = useState('');
  const [transitionDate, setTransitionDate] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const [data, dashboard, alerts, summary, dueFollowups] = await Promise.all([
        getCommercialLeads({
          status: statusFilter === 'all' ? undefined : statusFilter,
          responsavel: responsavelFilter === 'all' ? undefined : responsavelFilter,
          limit: pageSize,
          offset: (page - 1) * pageSize,
        }),
        getCommercialDashboard(kpiRange === 'all' ? undefined : kpiRange),
        getCommercialSlaAlerts({ maxAgeHours: 24, limit: 5 }),
        getCommercialDailySummary(),
        getCommercialFollowupsDue(5),
      ]);
      setLeads(data);
      setKpis(dashboard);
      setSlaAlerts(alerts);
      setDailySummary(summary);
      setFollowupsDue(dueFollowups);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Falha ao carregar pipeline.'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, responsavelFilter, page, kpiRange]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, responsavelFilter, origemFilter, search, blockedOnly]);

  useEffect(() => {
    const loadTimeline = async () => {
      if (!selectedLead) {
        setTimeline([]);
        return;
      }
      try {
        const events = await getCommercialLeadTimeline(selectedLead.leadId, 20);
        setTimeline(events);
      } catch {
        setTimeline([]);
      }
    };

    loadTimeline();
  }, [selectedLead]);

  const onCreateLead = async () => {
    try {
      setSaving(true);
      setError(null);
      await createCommercialLead({ nomeEscritorio, origem, responsavel });
      setNomeEscritorio('');
      setStatusMessage('Lead criado com sucesso.');
      await fetchLeads();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Falha ao criar lead.'));
    } finally {
      setSaving(false);
    }
  };

  const onMoveLead = async (
    lead: CommercialLead,
    to: CommercialLeadStatus,
    options?: { motivoNutricao?: string; motivoPerda?: string; dataProximaAcao?: string },
  ) => {
    try {
      setSaving(true);
      setError(null);
      const payload: {
        to: CommercialLeadStatus;
        dor01Ok?: boolean;
        dor02Ok?: boolean;
        dor03Ok?: boolean;
        motivoNutricao?: string;
        motivoPerda?: string;
        dataProximaAcao?: string;
      } = { to };
      if (to === 'diagnostico_agendado') payload.dor01Ok = true;
      if (to === 'proposta_enviada') payload.dor02Ok = true;
      if (to === 'fechado') payload.dor03Ok = true;
      if (to === 'nutricao') {
        payload.motivoNutricao = options?.motivoNutricao || 'Lead em acompanhamento';
        payload.dataProximaAcao = options?.dataProximaAcao || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
      }
      if (to === 'perdido') {
        payload.motivoPerda = options?.motivoPerda || 'Sem avanço na negociação';
      }
      await moveCommercialLead(lead.leadId, payload);
      setStatusMessage(`Lead movido para ${COLUMNS.find((c) => c.key === to)?.label}.`);
      await fetchLeads();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Falha ao mover lead.'));
    } finally {
      setSaving(false);
    }
  };

  const onSubmitBriefing = async (lead: CommercialLead) => {
    try {
      setSaving(true);
      setError(null);
      await submitCommercialForm(lead.leadId, {
        formType: 'briefing',
        payload: {
          source: 'hub-manual',
          note: 'Briefing registrado via painel comercial',
        },
      });
      setStatusMessage('Briefing registrado com sucesso no lead.');
      await fetchLeads();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Falha ao registrar briefing.'));
    } finally {
      setSaving(false);
    }
  };

  const onUpdateProofs = async (lead: CommercialLead, update: { contractStatus?: 'pendente' | 'assinado'; paymentStatus?: 'pendente' | 'pago'; observacao?: string }) => {
    try {
      setSaving(true);
      setError(null);
      await updateCommercialLeadProofs(lead.leadId, update);
      setStatusMessage('Status de provas atualizado.');
      await fetchLeads();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Falha ao atualizar provas de fechamento.'));
    } finally {
      setSaving(false);
    }
  };

  const onUpdateOnboarding = async (lead: CommercialLead, update: { d0Ok?: boolean; d1Ok?: boolean; d2Ok?: boolean; d3D4Ok?: boolean; d5D7Ok?: boolean; observacao?: string }) => {
    try {
      setSaving(true);
      setError(null);
      await updateCommercialLeadOnboarding(lead.leadId, update);
      setStatusMessage('Progresso de onboarding atualizado.');
      await fetchLeads();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Falha ao atualizar onboarding.'));
    } finally {
      setSaving(false);
    }
  };

  const onUpdatePrivacy = async (lead: CommercialLead, update: { consentGiven?: boolean; retentionUntil?: string; observacao?: string }) => {
    try {
      setSaving(true);
      setError(null);
      await updateCommercialLeadPrivacy(lead.leadId, update);
      setStatusMessage('Dados de LGPD atualizados.');
      await fetchLeads();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Falha ao atualizar LGPD.'));
    } finally {
      setSaving(false);
    }
  };

  const requestSpecialTransition = (lead: CommercialLead, to: 'nutricao' | 'perdido') => {
    setPendingTransition({ lead, to });
    setTransitionReason(to === 'nutricao' ? NURTURE_REASONS[0] : LOSS_REASONS[0]);
    setTransitionDate('');
  };

  const confirmSpecialTransition = async () => {
    if (!pendingTransition) return;

    if (!transitionReason.trim()) {
      setError('Informe o motivo para continuar.');
      return;
    }

    if (pendingTransition.to === 'nutricao' && !transitionDate) {
      setError('Informe a data da próxima ação para Nutrição.');
      return;
    }

    await onMoveLead(pendingTransition.lead, pendingTransition.to, {
      motivoNutricao: pendingTransition.to === 'nutricao' ? transitionReason : undefined,
      motivoPerda: pendingTransition.to === 'perdido' ? transitionReason : undefined,
      dataProximaAcao: pendingTransition.to === 'nutricao' ? new Date(`${transitionDate}T09:00:00`).toISOString() : undefined,
    });

    setPendingTransition(null);
    setTransitionReason('');
    setTransitionDate('');
  };

  const getAdvanceGuard = (lead: CommercialLead, targetStatus: CommercialLeadStatus): { ok: boolean; reason?: string } => {
    if (targetStatus === 'proposta_enviada') {
      if (lead.formType !== 'briefing') {
        return { ok: false, reason: 'Briefing obrigatório antes de enviar proposta.' };
      }
      if (!lead.consentGiven) {
        return { ok: false, reason: 'Consentimento LGPD obrigatório antes da proposta.' };
      }
    }

    if (targetStatus === 'fechado') {
      if (!canManageSensitive) {
        return { ok: false, reason: 'Apenas admin/manager podem fechar leads.' };
      }
      if (lead.contractStatus !== 'assinado' || lead.paymentStatus !== 'pago') {
        return { ok: false, reason: 'Fechamento exige contrato assinado e pagamento confirmado.' };
      }
    }

    return { ok: true };
  };

  const handleDropToColumn = async (targetStatus: CommercialLeadStatus, leadId?: string) => {
    const effectiveLeadId = leadId || draggingLeadId;
    if (!effectiveLeadId) return;

    const lead = leads.find((item) => item.leadId === effectiveLeadId);
    if (!lead) return;
    if (lead.statusAtual === targetStatus) return;

    const guard = getAdvanceGuard(lead, targetStatus);
    if (!guard.ok) {
      setError(guard.reason || 'Ação bloqueada por regra de negócio.');
      return;
    }

    await onMoveLead(lead, targetStatus);
  };

  const responsavelOptions = useMemo(() => {
    return Array.from(new Set(leads.map((lead) => lead.responsavel).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [leads]);

  const isLeadBlocked = (lead: CommercialLead): boolean => {
    if (lead.statusAtual === 'diagnostico_concluido') {
      return lead.formType !== 'briefing' || !lead.consentGiven;
    }

    if (lead.statusAtual === 'negociacao') {
      return lead.contractStatus !== 'assinado' || lead.paymentStatus !== 'pago';
    }

    return false;
  };

  const filteredLeads = useMemo(() => {
    const base = leads.filter((lead) => {
      if (statusFilter !== 'all' && lead.statusAtual !== statusFilter) return false;
      if (origemFilter !== 'all' && lead.origem !== origemFilter) return false;
      if (responsavelFilter !== 'all' && lead.responsavel !== responsavelFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = `${lead.nomeEscritorio} ${lead.origem} ${lead.responsavel}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (blockedOnly && !isLeadBlocked(lead)) return false;
      return true;
    });

    if (sortBy === 'name_asc') {
      return [...base].sort((a, b) => a.nomeEscritorio.localeCompare(b.nomeEscritorio, 'pt-BR'));
    }

    return base;
  }, [leads, statusFilter, origemFilter, responsavelFilter, search, sortBy, blockedOnly]);

  const leadsByStatus = useMemo(() => {
    const grouped: Record<string, CommercialLead[]> = {};
    for (const col of COLUMNS) grouped[col.key] = [];

    for (const lead of filteredLeads) grouped[lead.statusAtual]?.push(lead);

    return grouped;
  }, [filteredLeads]);

  const exportFilteredLeadsCsv = () => {
    const headers = [
      'leadId',
      'nomeEscritorio',
      'origem',
      'responsavel',
      'statusAtual',
      'dor01Ok',
      'dor02Ok',
      'dor03Ok',
      'dataEntrada',
      'updatedAt',
    ];

    const rows = filteredLeads.map((lead) => [
      lead.leadId,
      lead.nomeEscritorio,
      lead.origem,
      lead.responsavel,
      lead.statusAtual,
      lead.dor01Ok ? 'true' : 'false',
      lead.dor02Ok ? 'true' : 'false',
      lead.dor03Ok ? 'true' : 'false',
      lead.dataEntrada,
      lead.updatedAt,
    ]);

    const escapeCsv = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
    const content = [headers, ...rows]
      .map((cols) => cols.map((col) => escapeCsv(String(col ?? ''))).join(','))
      .join('\n');

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comercial-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setStatusMessage('Exportação CSV concluída.');
  };

  // KPIs são carregados do backend em /api/comercial/dashboard

  return (
    <PageShell
      eyebrow="Comercial"
      title="Pipeline Comercial"
      description="Módulo comercial do Hub: captação → diagnóstico → proposta → fechamento"
    >
      <section className="rounded-[12px] border border-border/60 bg-card/40 p-4 space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Novo lead</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input className="h-9 rounded-md border border-input bg-transparent px-3 text-sm" placeholder="Nome do escritório" value={nomeEscritorio} onChange={(e) => setNomeEscritorio(e.target.value)} />
          <select className="h-9 rounded-md border border-input bg-transparent px-2 text-sm" value={origem} onChange={(e) => setOrigem(e.target.value as typeof origem)}>
            <option value="instagram">instagram</option>
            <option value="indicacao">indicação</option>
            <option value="site">site</option>
            <option value="whatsapp">whatsapp</option>
            <option value="outro">outro</option>
          </select>
          <input className="h-9 rounded-md border border-input bg-transparent px-3 text-sm" placeholder="Responsável" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
          <button
            className="h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            disabled={!nomeEscritorio || saving}
            onClick={onCreateLead}
          >
            {saving ? 'Salvando...' : 'Criar lead'}
          </button>
        </div>
        {statusMessage && <p className="text-xs text-emerald-300">{statusMessage}</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </section>

      <section className="rounded-[12px] border border-border/60 bg-card/20 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground uppercase tracking-[0.15em]">Filtros</span>
          <div className="flex items-center gap-2">
            <button
              className={`h-7 px-2 rounded-md border text-[11px] ${blockedOnly ? 'border-amber-500/70 text-amber-300 bg-amber-500/10' : 'border-border text-muted-foreground'}`}
              onClick={() => setBlockedOnly((prev) => !prev)}
            >
              {blockedOnly ? 'Bloqueados: ON' : 'Bloqueados: OFF'}
            </button>
            <span className="text-[11px] text-muted-foreground">Exibindo {filteredLeads.length} de {leads.length} · Página {page}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <input
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
            placeholder="Buscar por escritório, origem ou responsável"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | CommercialLeadStatus)}
          >
            <option value="all">Status: Todos</option>
            {COLUMNS.map((col) => (
              <option key={col.key} value={col.key}>{col.label}</option>
            ))}
          </select>

          <select
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
            value={origemFilter}
            onChange={(e) => setOrigemFilter(e.target.value as typeof origemFilter)}
          >
            <option value="all">Origem: Todas</option>
            <option value="instagram">instagram</option>
            <option value="indicacao">indicação</option>
            <option value="site">site</option>
            <option value="whatsapp">whatsapp</option>
            <option value="outro">outro</option>
          </select>

          <select
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
            value={responsavelFilter}
            onChange={(e) => setResponsavelFilter(e.target.value)}
          >
            <option value="all">Responsável: Todos</option>
            {responsavelOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          <select
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'updated_desc' | 'name_asc')}
          >
            <option value="updated_desc">Ordenação: Atualização (desc)</option>
            <option value="name_asc">Ordenação: Nome (A-Z)</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            className="h-8 px-3 rounded-md border border-emerald-500/50 text-emerald-300 text-xs hover:bg-emerald-500/10 disabled:opacity-50"
            disabled={filteredLeads.length === 0}
            onClick={exportFilteredLeadsCsv}
          >
            Exportar CSV
          </button>
          <button
            className="h-8 px-3 rounded-md border border-border text-xs disabled:opacity-50"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Página anterior
          </button>
          <button
            className="h-8 px-3 rounded-md border border-border text-xs disabled:opacity-50"
            disabled={loading || leads.length < pageSize}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima página
          </button>
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-end">
          <select
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
            value={kpiRange}
            onChange={(e) => setKpiRange(e.target.value === 'all' ? 'all' : (Number(e.target.value) as 7 | 30))}
          >
            <option value="all">KPI: Todo período</option>
            <option value="7">KPI: Últimos 7 dias</option>
            <option value="30">KPI: Últimos 30 dias</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="rounded-[10px] border border-border/60 bg-card/30 p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Leads totais</p>
          <p className="text-xl font-semibold">{kpis.total}</p>
        </div>
        <div className="rounded-[10px] border border-border/60 bg-card/30 p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Novos</p>
          <p className="text-xl font-semibold">{kpis.novos}</p>
        </div>
        <div className="rounded-[10px] border border-border/60 bg-card/30 p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Diagnósticos</p>
          <p className="text-xl font-semibold">{kpis.diagnosticos}</p>
        </div>
        <div className="rounded-[10px] border border-border/60 bg-card/30 p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Propostas</p>
          <p className="text-xl font-semibold">{kpis.propostas}</p>
        </div>
          <div className="rounded-[10px] border border-border/60 bg-card/30 p-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Fechados</p>
            <p className="text-xl font-semibold text-emerald-300">{kpis.fechados}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[12px] border border-border/60 bg-card/20 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Resumo diário operacional</p>
          <p className="text-xs text-muted-foreground">{dailySummary?.date || '—'}</p>
        </div>

        {dailySummary && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div className="rounded-md border border-border/50 bg-background/40 px-2 py-1">
              <p className="text-[10px] uppercase text-muted-foreground">Novos leads</p>
              <p className="text-sm font-semibold">{dailySummary.novosLeads}</p>
            </div>
            <div className="rounded-md border border-border/50 bg-background/40 px-2 py-1">
              <p className="text-[10px] uppercase text-muted-foreground">Atrasados SLA</p>
              <p className="text-sm font-semibold text-amber-300">{dailySummary.leadsAtrasadosSla24h}</p>
            </div>
            <div className="rounded-md border border-border/50 bg-background/40 px-2 py-1">
              <p className="text-[10px] uppercase text-muted-foreground">Propostas sem follow-up</p>
              <p className="text-sm font-semibold">{dailySummary.propostasSemFollowup}</p>
            </div>
            <div className="rounded-md border border-border/50 bg-background/40 px-2 py-1">
              <p className="text-[10px] uppercase text-muted-foreground">Negociações abertas</p>
              <p className="text-sm font-semibold">{dailySummary.negociacoesAbertas}</p>
            </div>
            <div className="rounded-md border border-border/50 bg-background/40 px-2 py-1">
              <p className="text-[10px] uppercase text-muted-foreground">Fechados hoje</p>
              <p className="text-sm font-semibold text-emerald-300">{dailySummary.fechadosHoje}</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Follow-ups vencidos</p>
          <p className="text-xs text-muted-foreground">{followupsDue.length} pendente(s)</p>
        </div>
        {followupsDue.length === 0 ? (
          <p className="text-xs text-emerald-300">Nenhum follow-up vencido no momento.</p>
        ) : (
          <div className="space-y-1">
            {followupsDue.map((item) => (
              <div key={`${item.leadId}-${item.followupType}`} className="text-xs text-muted-foreground rounded-md border border-border/50 bg-background/40 px-2 py-1">
                <span className="text-foreground font-medium">{item.nomeEscritorio}</span> · {item.followupType} · {new Date(item.dueAt).toLocaleString('pt-BR')} · resp: {item.responsavel}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Alertas de SLA (24h)</p>
          <p className="text-xs text-muted-foreground">{slaAlerts.length} lead(s) atrasado(s)</p>
        </div>
        {slaAlerts.length === 0 ? (
          <p className="text-xs text-emerald-300">Nenhum lead atrasado no SLA de 24h.</p>
        ) : (
          <div className="space-y-1">
            {slaAlerts.map((alert) => (
              <div key={alert.leadId} className="text-xs text-muted-foreground rounded-md border border-border/50 bg-background/40 px-2 py-1">
                <span className="text-foreground font-medium">{alert.nomeEscritorio}</span> · {alert.statusAtual} · {alert.hoursInStatus}h · resp: {alert.responsavel}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 2xl:grid-cols-[1fr_340px] gap-4 items-start">
        {loading ? (
          <section className="rounded-[12px] border border-border/60 bg-card/20 p-4 space-y-3">
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Carregando pipeline</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="h-20 rounded-md bg-muted/20 animate-pulse" />
              <div className="h-20 rounded-md bg-muted/20 animate-pulse" />
              <div className="h-20 rounded-md bg-muted/20 animate-pulse" />
            </div>
          </section>
        ) : filteredLeads.length === 0 ? (
          <section className="rounded-[12px] border border-border/60 bg-card/20 p-6 text-center space-y-3">
            <p className="text-sm font-medium">Nenhum lead encontrado com os filtros atuais.</p>
            <p className="text-xs text-muted-foreground">Ajuste os filtros ou cadastre um novo lead para iniciar o pipeline.</p>
            <div className="flex items-center justify-center gap-2">
              <button
                className="h-8 px-3 rounded-md border border-border text-xs"
                onClick={() => {
                  setSearch('');
                  setOrigemFilter('all');
                  setResponsavelFilter('all');
                  setStatusFilter('all');
                }}
              >
                Limpar filtros
              </button>
            </div>
          </section>
        ) : (
          <section className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-9 gap-3">
            {COLUMNS.map((col) => (
              <div
                key={col.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setHoverColumn(col.key);
                }}
                onDragLeave={() => setHoverColumn((prev) => (prev === col.key ? null : prev))}
                onDrop={async (e) => {
                  e.preventDefault();
                  const droppedLeadId = e.dataTransfer.getData('text/plain');
                  await handleDropToColumn(col.key, droppedLeadId || undefined);
                  setDraggingLeadId(null);
                  setHoverColumn(null);
                }}
                className={`rounded-[12px] border bg-card/30 p-3 space-y-2 min-h-[220px] ${hoverColumn === col.key ? 'border-primary/70' : 'border-border/60'}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{col.label}</h3>
                  <span className="text-[11px] text-muted-foreground">{(leadsByStatus[col.key] || []).length}</span>
                </div>

                <div className="space-y-2">
                  {(leadsByStatus[col.key] || []).map((lead) => {
                    const next = NEXT_STATUS[lead.statusAtual];
                    return (
                      <article
                        key={lead.leadId}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', lead.leadId);
                          setDraggingLeadId(lead.leadId);
                        }}
                        onDragEnd={() => {
                          setDraggingLeadId(null);
                          setHoverColumn(null);
                        }}
                        className={`rounded-lg border p-2 space-y-2 cursor-pointer transition-colors ${selectedLead?.leadId === lead.leadId ? 'border-primary/70 bg-primary/5' : 'border-border/60 bg-background/60'}`}
                        onClick={() => setSelectedLead(lead)}
                      >
                        <p className="text-sm font-medium leading-tight">{lead.nomeEscritorio}</p>
                        <p className="text-[11px] text-muted-foreground">Origem: {lead.origem}</p>
                        <p className="text-[11px] text-muted-foreground">Resp: {lead.responsavel}</p>
                        {next && (() => {
                          const guard = getAdvanceGuard(lead, next);
                          return (
                            <button
                              className="w-full h-7 rounded-md border border-primary/50 text-primary text-xs hover:bg-primary/10 disabled:opacity-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!guard.ok) {
                                  setError(guard.reason || 'Ação bloqueada por regra de negócio.');
                                  return;
                                }
                                onMoveLead(lead, next);
                              }}
                              disabled={saving || !guard.ok}
                              title={!guard.ok ? guard.reason : undefined}
                            >
                              Avançar para {COLUMNS.find((c) => c.key === next)?.label}
                            </button>
                          );
                        })()}
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        )}

        <aside className="rounded-[12px] border border-border/60 bg-card/30 p-4 space-y-3 sticky top-20">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Detalhe do Lead</p>
            {selectedLead && (
              <button className="text-muted-foreground hover:text-foreground" onClick={() => setSelectedLead(null)}>
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {!selectedLead ? (
            <p className="text-sm text-muted-foreground">Selecione um card no Kanban para ver detalhes e ações rápidas.</p>
          ) : (
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Escritório:</span> {selectedLead.nomeEscritorio}</p>
              <p><span className="text-muted-foreground">Origem:</span> {selectedLead.origem}</p>
              <p><span className="text-muted-foreground">Responsável:</span> {selectedLead.responsavel}</p>
              <p><span className="text-muted-foreground">Status:</span> {COLUMNS.find((c) => c.key === selectedLead.statusAtual)?.label}</p>
              <p><span className="text-muted-foreground">DoR:</span> 01 {selectedLead.dor01Ok ? '✅' : '❌'} · 02 {selectedLead.dor02Ok ? '✅' : '❌'} · 03 {selectedLead.dor03Ok ? '✅' : '❌'}</p>
              <p><span className="text-muted-foreground">Form token:</span> {selectedLead.formToken || '—'}</p>
              <p><span className="text-muted-foreground">Form status:</span> {selectedLead.formType ? `${selectedLead.formType} enviado` : 'não enviado'}</p>
              <p><span className="text-muted-foreground">Última submissão:</span> {selectedLead.formSubmittedAt ? new Date(selectedLead.formSubmittedAt).toLocaleString('pt-BR') : '—'}</p>
              <p><span className="text-muted-foreground">Contrato:</span> {selectedLead.contractStatus}</p>
              <p><span className="text-muted-foreground">Pagamento:</span> {selectedLead.paymentStatus}</p>
              <p><span className="text-muted-foreground">Follow-up D+2:</span> {selectedLead.followupD2At ? new Date(selectedLead.followupD2At).toLocaleString('pt-BR') : '—'}</p>
              <p><span className="text-muted-foreground">Follow-up D+5:</span> {selectedLead.followupD5At ? new Date(selectedLead.followupD5At).toLocaleString('pt-BR') : '—'}</p>
              <p><span className="text-muted-foreground">Onboarding:</span> D0 {selectedLead.onboardingD0Ok ? '✅' : '❌'} · D1 {selectedLead.onboardingD1Ok ? '✅' : '❌'} · D2 {selectedLead.onboardingD2Ok ? '✅' : '❌'} · D3-4 {selectedLead.onboardingD3D4Ok ? '✅' : '❌'} · D5-7 {selectedLead.onboardingD5D7Ok ? '✅' : '❌'}</p>
              <p><span className="text-muted-foreground">Consentimento LGPD:</span> {selectedLead.consentGiven ? '✅ confirmado' : '❌ pendente'}</p>
              <p><span className="text-muted-foreground">Consentimento em:</span> {selectedLead.consentGivenAt ? new Date(selectedLead.consentGivenAt).toLocaleString('pt-BR') : '—'}</p>
              <p><span className="text-muted-foreground">Retenção até:</span> {selectedLead.retentionUntil ? new Date(selectedLead.retentionUntil).toLocaleDateString('pt-BR') : '—'}</p>
              {!canManageSensitive && <p className="text-xs text-amber-300">Perfil analista: ações sensíveis (fechar, provas, onboarding, LGPD) bloqueadas.</p>}

              <div className="rounded-md border border-border/50 bg-background/40 px-2 py-2 space-y-1">
                <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Checklist operacional</p>
                <p className="text-[11px] text-muted-foreground">Briefing: {selectedLead.formType === 'briefing' ? '✅' : '❌'}</p>
                <p className="text-[11px] text-muted-foreground">LGPD: {selectedLead.consentGiven ? '✅' : '❌'}</p>
                <p className="text-[11px] text-muted-foreground">Contrato: {selectedLead.contractStatus === 'assinado' ? '✅' : '❌'}</p>
                <p className="text-[11px] text-muted-foreground">Pagamento: {selectedLead.paymentStatus === 'pago' ? '✅' : '❌'}</p>
              </div>

              <div className="pt-2 grid grid-cols-1 gap-2">
                {canManageSensitive && !selectedLead.consentGiven && (
                  <button
                    className="h-8 rounded-md border border-fuchsia-500/60 text-fuchsia-300 text-xs hover:bg-fuchsia-500/10"
                    disabled={saving}
                    onClick={() => onUpdatePrivacy(selectedLead, {
                      consentGiven: true,
                      retentionUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
                      observacao: 'Consentimento LGPD confirmado',
                    })}
                  >
                    Confirmar consentimento LGPD
                  </button>
                )}
                {canManageSensitive && selectedLead.statusAtual === 'fechado' && !selectedLead.onboardingD0Ok && (
                  <button
                    className="h-8 rounded-md border border-cyan-500/60 text-cyan-300 text-xs hover:bg-cyan-500/10"
                    disabled={saving}
                    onClick={() => onUpdateOnboarding(selectedLead, { d0Ok: true, observacao: 'D0 confirmado' })}
                  >
                    Marcar onboarding D0
                  </button>
                )}
                {canManageSensitive && selectedLead.statusAtual === 'fechado' && selectedLead.onboardingD0Ok && !selectedLead.onboardingD1Ok && (
                  <button
                    className="h-8 rounded-md border border-cyan-500/60 text-cyan-300 text-xs hover:bg-cyan-500/10"
                    disabled={saving}
                    onClick={() => onUpdateOnboarding(selectedLead, { d1Ok: true, observacao: 'D1 confirmado' })}
                  >
                    Marcar onboarding D1
                  </button>
                )}
                {canManageSensitive && selectedLead.statusAtual === 'fechado' && selectedLead.onboardingD1Ok && !selectedLead.onboardingD2Ok && (
                  <button
                    className="h-8 rounded-md border border-cyan-500/60 text-cyan-300 text-xs hover:bg-cyan-500/10"
                    disabled={saving}
                    onClick={() => onUpdateOnboarding(selectedLead, { d2Ok: true, observacao: 'D2 confirmado' })}
                  >
                    Marcar onboarding D2
                  </button>
                )}
                {canManageSensitive && selectedLead.statusAtual === 'fechado' && selectedLead.onboardingD2Ok && !selectedLead.onboardingD3D4Ok && (
                  <button
                    className="h-8 rounded-md border border-cyan-500/60 text-cyan-300 text-xs hover:bg-cyan-500/10"
                    disabled={saving}
                    onClick={() => onUpdateOnboarding(selectedLead, { d3D4Ok: true, observacao: 'D3-D4 confirmado' })}
                  >
                    Marcar onboarding D3-D4
                  </button>
                )}
                {canManageSensitive && selectedLead.statusAtual === 'fechado' && selectedLead.onboardingD3D4Ok && !selectedLead.onboardingD5D7Ok && (
                  <button
                    className="h-8 rounded-md border border-cyan-500/60 text-cyan-300 text-xs hover:bg-cyan-500/10"
                    disabled={saving}
                    onClick={() => onUpdateOnboarding(selectedLead, { d5D7Ok: true, observacao: 'D5-D7 confirmado' })}
                  >
                    Marcar onboarding D5-D7
                  </button>
                )}
                {canManageSensitive && selectedLead.contractStatus !== 'assinado' && (
                  <button
                    className="h-8 rounded-md border border-emerald-500/60 text-emerald-300 text-xs hover:bg-emerald-500/10"
                    disabled={saving}
                    onClick={() => onUpdateProofs(selectedLead, { contractStatus: 'assinado', observacao: 'Contrato assinado confirmado' })}
                  >
                    Marcar contrato assinado
                  </button>
                )}
                {canManageSensitive && selectedLead.paymentStatus !== 'pago' && (
                  <button
                    className="h-8 rounded-md border border-violet-500/60 text-violet-300 text-xs hover:bg-violet-500/10"
                    disabled={saving}
                    onClick={() => onUpdateProofs(selectedLead, { paymentStatus: 'pago', observacao: 'Pagamento inicial confirmado' })}
                  >
                    Marcar pagamento confirmado
                  </button>
                )}
                {!selectedLead.formType && (
                  <button
                    className="h-8 rounded-md border border-sky-500/60 text-sky-300 text-xs hover:bg-sky-500/10"
                    disabled={saving}
                    onClick={() => onSubmitBriefing(selectedLead)}
                  >
                    Registrar briefing
                  </button>
                )}
                {selectedLead.statusAtual !== 'nutricao' && selectedLead.statusAtual !== 'perdido' && selectedLead.statusAtual !== 'fechado' && (
                  <button
                    className="h-8 rounded-md border border-amber-500/50 text-amber-300 text-xs hover:bg-amber-500/10"
                    disabled={saving}
                    onClick={() => requestSpecialTransition(selectedLead, 'nutricao')}
                  >
                    Mover para Nutrição
                  </button>
                )}
                {selectedLead.statusAtual !== 'perdido' && selectedLead.statusAtual !== 'fechado' && (
                  <button
                    className="h-8 rounded-md border border-destructive/60 text-destructive text-xs hover:bg-destructive/10"
                    disabled={saving}
                    onClick={() => requestSpecialTransition(selectedLead, 'perdido')}
                  >
                    Marcar como Perdido
                  </button>
                )}
              </div>

              <div className="pt-2 space-y-1">
                <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Timeline</p>
                {timeline.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sem eventos recentes para este lead.</p>
                ) : (
                  <div className="space-y-1 max-h-44 overflow-auto pr-1">
                    {timeline.map((event) => (
                      <div key={event.id} className="rounded-md border border-border/50 bg-background/40 px-2 py-1">
                        <p className="text-[11px] text-foreground">{event.statusOrigem} → {event.statusDestino}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(event.createdAt).toLocaleString('pt-BR')} · {event.actor || 'system'}</p>
                        {event.observacao && <p className="text-[10px] text-muted-foreground">{event.observacao}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      {pendingTransition && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-[12px] border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold">
              Confirmar transição: {pendingTransition.to === 'nutricao' ? 'Nutrição' : 'Perdido'}
            </h3>
            <p className="text-xs text-muted-foreground">Lead: {pendingTransition.lead.nomeEscritorio}</p>

            <select
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={transitionReason}
              onChange={(e) => setTransitionReason(e.target.value)}
            >
              {(pendingTransition.to === 'nutricao' ? NURTURE_REASONS : LOSS_REASONS).map((reason) => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>

            {pendingTransition.to === 'nutricao' && (
              <input
                type="date"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={transitionDate}
                onChange={(e) => setTransitionDate(e.target.value)}
              />
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                className="h-8 px-3 rounded-md border border-border text-xs"
                onClick={() => setPendingTransition(null)}
              >
                Cancelar
              </button>
              <button
                className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs disabled:opacity-50"
                onClick={confirmSpecialTransition}
                disabled={saving}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

