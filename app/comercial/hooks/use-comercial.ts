'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import {
  CommercialDashboard,
  CommercialLead,
  CommercialLeadStatus,
  CommercialSlaAlert,
  CommercialDailySummary,
  CommercialLeadTimelineEvent,
  CommercialIntegrationEvent,
  CommercialDispatchHealthSummary,
  CommercialFollowupDue,
  CommercialRetentionAlert,
  getCommercialDashboard,
  getCommercialDailySummary,
  getCommercialFollowupsDue,
  triggerCommercialFollowupDispatch,
  getCommercialRetentionDue,
  getCommercialLeadFormLink,
  getCommercialLeadTimeline,
  getCommercialIntegrationEvents,
  getCommercialDispatchHealth,
  getCommercialLeads,
  getCommercialSlaAlerts,
  moveCommercialLead,
  submitCommercialForm,
  updateCommercialLeadOnboarding,
  updateCommercialLeadPrivacy,
  updateCommercialLeadProofs,
  dispatchCommercialCommunication,
  deleteCommercialLead,
} from '@/lib/api/client/commercial';
import { useAuth } from '@/contexts/auth-context';

export const COLUMNS: Array<{ key: CommercialLeadStatus; label: string }> = [
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

export const NEXT_STATUS: Partial<Record<CommercialLeadStatus, CommercialLeadStatus>> = {
  novo_lead: 'primeiro_contato',
  primeiro_contato: 'diagnostico_agendado',
  diagnostico_agendado: 'diagnostico_concluido',
  diagnostico_concluido: 'proposta_enviada',
  proposta_enviada: 'negociacao',
  negociacao: 'fechado',
};

export const NURTURE_REASONS = [
  'Sem urgência no momento',
  'Aguardando decisão interna',
  'Aguardando retorno do sócio',
  'Momento financeiro inadequado',
  'Contato sem resposta temporária',
] as const;

export const LOSS_REASONS = [
  'Sem orçamento',
  'Fechou com concorrente',
  'Sem fit de perfil',
  'Sem retorno após follow-up',
  'Projeto adiado/cancelado',
] as const;

export type PendingTransition = { lead: CommercialLead; to: 'nutricao' | 'perdido' };
export type ConcluirDiagLead = CommercialLead;

const getDispatchStage = (
  status: CommercialLeadStatus,
): 'primeiro_contato' | 'diagnostico_agendado' | 'proposta_enviada' | 'negociacao' | 'fechado' | null => {
  if (status === 'novo_lead' || status === 'primeiro_contato') return 'primeiro_contato';
  if (status === 'diagnostico_agendado' || status === 'diagnostico_concluido') return 'diagnostico_agendado';
  if (status === 'proposta_enviada') return 'proposta_enviada';
  if (status === 'negociacao') return 'negociacao';
  if (status === 'fechado') return 'fechado';
  return null;
};

const toApiError = (err: unknown, fallback: string): string => {
  if (err instanceof AxiosError) {
    const payload = err.response?.data as { message?: string } | undefined;
    if (payload?.message) return payload.message;
  }
  return fallback;
};

const PAGE_SIZE = 50;

export function useComercial() {
  const { user } = useAuth();
  const canManageSensitive = user?.role === 'admin' || user?.role === 'manager';

  // ── Data ──────────────────────────────────────────────────────────────────
  const [leads, setLeads] = useState<CommercialLead[]>([]);
  const [kpis, setKpis] = useState<CommercialDashboard>({ total: 0, novos: 0, diagnosticos: 0, propostas: 0, fechados: 0 });
  const [slaAlerts, setSlaAlerts] = useState<CommercialSlaAlert[]>([]);
  const [dailySummary, setDailySummary] = useState<CommercialDailySummary | null>(null);
  const [dispatchHealth, setDispatchHealth] = useState<CommercialDispatchHealthSummary | null>(null);
  const [timeline, setTimeline] = useState<CommercialLeadTimelineEvent[]>([]);
  const [integrationEvents, setIntegrationEvents] = useState<CommercialIntegrationEvent[]>([]);
  const [followupsDue, setFollowupsDue] = useState<CommercialFollowupDue[]>([]);
  const [retentionDue, setRetentionDue] = useState<CommercialRetentionAlert[]>([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [novoLeadOpen, setNovoLeadOpen] = useState(false);
  const [editarLeadOpen, setEditarLeadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<CommercialLead | null>(null);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [hoverColumn, setHoverColumn] = useState<CommercialLeadStatus | null>(null);
  const [pendingTransition, setPendingTransition] = useState<PendingTransition | null>(null);
  const [concluirDiagLead, setConcluirDiagLead] = useState<ConcluirDiagLead | null>(null);
  const [observacaoDiag, setObservacaoDiag] = useState('');
  const [pendingDeleteLead, setPendingDeleteLead] = useState<CommercialLead | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [transitionReason, setTransitionReason] = useState('');
  const [transitionDate, setTransitionDate] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Filters ───────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [inconsistentOnly, setInconsistentOnly] = useState(false);
  const [origemFilter, setOrigemFilter] = useState<'all' | 'instagram' | 'indicacao' | 'site' | 'whatsapp' | 'outro'>('all');
  const [responsavelFilter, setResponsavelFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CommercialLeadStatus>('all');
  const [kpiRange, setKpiRange] = useState<'all' | 7 | 30>('all');
  const [sortBy, setSortBy] = useState<'updated_desc' | 'name_asc'>('updated_desc');
  const [page, setPage] = useState(1);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const [data, dashboard, alerts, summary, dispatch, dueFollowups, dueRetention] = await Promise.all([
        getCommercialLeads({ status: statusFilter === 'all' ? undefined : statusFilter, responsavel: responsavelFilter === 'all' ? undefined : responsavelFilter, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
        getCommercialDashboard(kpiRange === 'all' ? undefined : kpiRange),
        getCommercialSlaAlerts({ maxAgeHours: 24, limit: 5 }),
        getCommercialDailySummary(),
        getCommercialDispatchHealth(7),
        getCommercialFollowupsDue(5),
        getCommercialRetentionDue(5),
      ]);
      setLeads(data);
      setKpis(dashboard);
      setSlaAlerts(alerts);
      setDailySummary(summary);
      setDispatchHealth(dispatch);
      setFollowupsDue(dueFollowups);
      setRetentionDue(dueRetention);
    } catch (err) {
      setError(toApiError(err, 'Falha ao carregar pipeline.'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, responsavelFilter, page, kpiRange]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { setPage(1); }, [statusFilter, responsavelFilter, origemFilter, search, blockedOnly, inconsistentOnly]);

  useEffect(() => {
    if (!selectedLead) { setTimeline([]); setIntegrationEvents([]); return; }
    Promise.all([
      getCommercialLeadTimeline(selectedLead.leadId, 20),
      getCommercialIntegrationEvents(selectedLead.leadId, 20),
    ]).then(([events, integrations]) => {
      setTimeline(events);
      setIntegrationEvents(integrations);
    }).catch(() => { setTimeline([]); setIntegrationEvents([]); });
  }, [selectedLead]);

  // ── Business logic helpers ────────────────────────────────────────────────
  const isLeadBlocked = (lead: CommercialLead): boolean => {
    if (lead.statusAtual === 'diagnostico_concluido') return lead.formType !== 'briefing' || !lead.consentGiven;
    if (lead.statusAtual === 'negociacao') return lead.contractStatus !== 'assinado' || lead.paymentStatus !== 'pago';
    return false;
  };

  const hasOperationalInconsistency = (lead: CommercialLead): boolean => {
    if (['proposta_enviada', 'negociacao', 'fechado'].includes(lead.statusAtual) && !lead.consentGiven) return true;
    if (lead.statusAtual === 'fechado' && (lead.contractStatus !== 'assinado' || lead.paymentStatus !== 'pago')) return true;
    return false;
  };

  const getAdvanceGuard = (lead: CommercialLead, targetStatus: CommercialLeadStatus): { ok: boolean; reason?: string } => {
    if (targetStatus === 'proposta_enviada') {
      if (lead.formType !== 'briefing') return { ok: false, reason: 'Briefing obrigatório antes de enviar proposta.' };
      if (!lead.consentGiven) return { ok: false, reason: 'Consentimento LGPD obrigatório antes da proposta.' };
    }
    if (targetStatus === 'fechado') {
      if (!canManageSensitive) return { ok: false, reason: 'Apenas admin/manager podem fechar leads.' };
      if (lead.contractStatus !== 'assinado' || lead.paymentStatus !== 'pago') return { ok: false, reason: 'Fechamento exige contrato assinado e pagamento confirmado.' };
    }
    return { ok: true };
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const onMoveLead = async (
    lead: CommercialLead,
    to: CommercialLeadStatus,
    options?: { motivoNutricao?: string; motivoPerda?: string; dataProximaAcao?: string; observacao?: string },
  ) => {
    try {
      setSaving(true); setError(null);
      const payload: Record<string, unknown> = { to };
      if (to === 'diagnostico_agendado') payload.dor01Ok = true;
      if (to === 'proposta_enviada') payload.dor02Ok = true;
      if (to === 'fechado') payload.dor03Ok = true;
      if (options?.observacao) payload.observacao = options.observacao;
      if (to === 'nutricao') {
        payload.motivoNutricao = options?.motivoNutricao || 'Lead em acompanhamento';
        payload.dataProximaAcao = options?.dataProximaAcao || new Date(Date.now() + 2 * 86400000).toISOString();
      }
      if (to === 'perdido') payload.motivoPerda = options?.motivoPerda || 'Sem avanço na negociação';
      await moveCommercialLead(lead.leadId, payload as unknown as Parameters<typeof moveCommercialLead>[1]);
      setStatusMessage(`Lead movido para ${COLUMNS.find((c) => c.key === to)?.label}.`);
      await fetchLeads();
    } catch (err) { setError(toApiError(err, 'Falha ao mover lead.')); }
    finally { setSaving(false); }
  };

  const handleDropToColumn = async (targetStatus: CommercialLeadStatus, leadId?: string) => {
    const id = leadId || draggingLeadId;
    if (!id) return;
    const lead = leads.find((l) => l.leadId === id);
    if (!lead || lead.statusAtual === targetStatus) return;
    const guard = getAdvanceGuard(lead, targetStatus);
    if (!guard.ok) { setError(guard.reason || 'Ação bloqueada.'); return; }
    await onMoveLead(lead, targetStatus);
  };

  const requestSpecialTransition = (lead: CommercialLead, to: 'nutricao' | 'perdido') => {
    setPendingTransition({ lead, to });
    setTransitionReason(to === 'nutricao' ? NURTURE_REASONS[0] : LOSS_REASONS[0]);
    setTransitionDate('');
  };

  const confirmSpecialTransition = async () => {
    if (!pendingTransition || !transitionReason.trim()) { setError('Informe o motivo para continuar.'); return; }
    if (pendingTransition.to === 'nutricao' && !transitionDate) { setError('Informe a data da próxima ação.'); return; }
    await onMoveLead(pendingTransition.lead, pendingTransition.to, {
      motivoNutricao: pendingTransition.to === 'nutricao' ? transitionReason : undefined,
      motivoPerda: pendingTransition.to === 'perdido' ? transitionReason : undefined,
      dataProximaAcao: pendingTransition.to === 'nutricao' ? new Date(`${transitionDate}T09:00:00`).toISOString() : undefined,
    });
    setPendingTransition(null); setTransitionReason(''); setTransitionDate('');
  };

  const requestConcluirDiag = (lead: CommercialLead) => {
    setConcluirDiagLead(lead);
    setObservacaoDiag('');
  };

  const confirmConcluirDiag = async () => {
    if (!concluirDiagLead) return;
    if (observacaoDiag.trim().length < 10) { setError('Resumo deve ter ao menos 10 caracteres.'); return; }
    await onMoveLead(concluirDiagLead, 'diagnostico_concluido', { observacao: observacaoDiag.trim() });
    setConcluirDiagLead(null);
    setObservacaoDiag('');
  };

  const onDeleteLeadPermanently = async () => {
    if (!pendingDeleteLead) return;
    if (deleteConfirmText.trim() !== 'EXCLUIR') { setError('Digite EXCLUIR para confirmar.'); return; }
    try {
      setSaving(true); setError(null);
      await deleteCommercialLead(pendingDeleteLead.leadId, { confirmText: 'EXCLUIR', reason: deleteReason.trim() || 'Exclusão administrativa manual' });
      setStatusMessage('Lead excluído permanentemente.');
      if (selectedLead?.leadId === pendingDeleteLead.leadId) setSelectedLead(null);
      setPendingDeleteLead(null); setDeleteConfirmText(''); setDeleteReason('');
      await fetchLeads();
    } catch (err) { setError(toApiError(err, 'Falha ao excluir lead.')); }
    finally { setSaving(false); }
  };

  const onDispatchByStage = async (lead: CommercialLead, channel: 'whatsapp' | 'gmail') => {
    const stage = getDispatchStage(lead.statusAtual);
    if (!stage) { setError('Status atual não possui template de dispatch.'); return; }
    try {
      setSaving(true); setError(null);
      const result = await dispatchCommercialCommunication({ leadId: lead.leadId, channel, stage, variables: { nomeEscritorio: lead.nomeEscritorio, responsavel: lead.responsavel, statusAtual: lead.statusAtual } });
      setStatusMessage(`Dispatch ${channel} enviado (eventId: ${result.eventId}).`);
      await fetchLeads();
    } catch (err) { setError(toApiError(err, `Falha ao disparar via ${channel}.`)); }
    finally { setSaving(false); }
  };

  const onTriggerFollowup = async (leadId: string, followupType: 'D+2' | 'D+5') => {
    try {
      setSaving(true); setError(null);
      const result = await triggerCommercialFollowupDispatch({ leadId, followupType, channel: 'whatsapp' });
      setStatusMessage(`Follow-up ${followupType} disparado (eventId: ${result.eventId}).`);
      await fetchLeads();
    } catch (err) { setError(toApiError(err, `Falha ao disparar follow-up ${followupType}.`)); }
    finally { setSaving(false); }
  };

  const onSubmitBriefing = async (lead: CommercialLead) => {
    try {
      setSaving(true); setError(null);
      await submitCommercialForm(lead.leadId, { formType: 'briefing', payload: { source: 'hub-manual', note: 'Briefing via painel' } });
      setStatusMessage('Briefing registrado.'); await fetchLeads();
    } catch (err) { setError(toApiError(err, 'Falha ao registrar briefing.')); }
    finally { setSaving(false); }
  };

  const onGenerateBriefingLink = async (lead: CommercialLead) => {
    try {
      setSaving(true); setError(null);
      const form = await getCommercialLeadFormLink(lead.leadId, 'briefing');
      await navigator.clipboard.writeText(form.url);
      setStatusMessage('Link copiado para área de transferência.');
    } catch (err) { setError(toApiError(err, 'Falha ao gerar link.')); }
    finally { setSaving(false); }
  };

  const onUpdateProofs = async (lead: CommercialLead, update: Parameters<typeof updateCommercialLeadProofs>[1]) => {
    try { setSaving(true); setError(null); await updateCommercialLeadProofs(lead.leadId, update); setStatusMessage('Provas atualizadas.'); await fetchLeads(); }
    catch (err) { setError(toApiError(err, 'Falha ao atualizar provas.')); }
    finally { setSaving(false); }
  };

  const onUpdateOnboarding = async (lead: CommercialLead, update: Parameters<typeof updateCommercialLeadOnboarding>[1]) => {
    try { setSaving(true); setError(null); await updateCommercialLeadOnboarding(lead.leadId, update); setStatusMessage('Onboarding atualizado.'); await fetchLeads(); }
    catch (err) { setError(toApiError(err, 'Falha ao atualizar onboarding.')); }
    finally { setSaving(false); }
  };

  const onUpdatePrivacy = async (lead: CommercialLead, update: Parameters<typeof updateCommercialLeadPrivacy>[1]) => {
    try { setSaving(true); setError(null); await updateCommercialLeadPrivacy(lead.leadId, update); setStatusMessage('LGPD atualizado.'); await fetchLeads(); }
    catch (err) { setError(toApiError(err, 'Falha ao atualizar LGPD.')); }
    finally { setSaving(false); }
  };

  const exportFilteredLeadsCsv = () => {
    const headers = ['leadId', 'nomeEscritorio', 'origem', 'responsavel', 'statusAtual', 'dor01Ok', 'dor02Ok', 'dor03Ok', 'dataEntrada', 'updatedAt'];
    const rows = filteredLeads.map((l) => [l.leadId, l.nomeEscritorio, l.origem, l.responsavel, l.statusAtual, l.dor01Ok, l.dor02Ok, l.dor03Ok, l.dataEntrada, l.updatedAt]);
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const content = [headers, ...rows].map((cols) => cols.map(esc).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `leads-${new Date().toISOString().slice(0, 10)}.csv` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    setStatusMessage('Exportação CSV concluída.');
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const responsavelOptions = useMemo(() =>
    Array.from(new Set(leads.map((l) => l.responsavel).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [leads]);

  const filteredLeads = useMemo(() => {
    let base = leads.filter((l) => {
      if (statusFilter !== 'all' && l.statusAtual !== statusFilter) return false;
      if (origemFilter !== 'all' && l.origem !== origemFilter) return false;
      if (responsavelFilter !== 'all' && l.responsavel !== responsavelFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!`${l.nomeEscritorio} ${l.origem} ${l.responsavel}`.toLowerCase().includes(q)) return false;
      }
      if (blockedOnly && !isLeadBlocked(l)) return false;
      if (inconsistentOnly && !hasOperationalInconsistency(l)) return false;
      return true;
    });
    if (sortBy === 'name_asc') base = [...base].sort((a, b) => a.nomeEscritorio.localeCompare(b.nomeEscritorio, 'pt-BR'));
    return base;
  }, [leads, statusFilter, origemFilter, responsavelFilter, search, sortBy, blockedOnly, inconsistentOnly]);

  const leadsByStatus = useMemo(() => {
    const grouped: Record<string, CommercialLead[]> = {};
    for (const col of COLUMNS) grouped[col.key] = [];
    for (const lead of filteredLeads) grouped[lead.statusAtual]?.push(lead);
    return grouped;
  }, [filteredLeads]);

  const executiveFunnel = useMemo(() => {
    const total = Math.max(filteredLeads.length, 1);
    const count = (s: CommercialLeadStatus) => (leadsByStatus[s] || []).length;
    const diagnostico = count('diagnostico_agendado') + count('diagnostico_concluido');
    const proposta = count('proposta_enviada');
    const fechado = count('fechado');
    return {
      primeiroContato: count('primeiro_contato'), diagnostico, proposta, negociacao: count('negociacao'), fechado,
      taxaFechamento: +((fechado / total) * 100).toFixed(1),
      taxaDiagToProposta: diagnostico > 0 ? +((proposta / diagnostico) * 100).toFixed(1) : 0,
      taxaPropostaToFechado: proposta > 0 ? +((fechado / proposta) * 100).toFixed(1) : 0,
    };
  }, [filteredLeads, leadsByStatus]);

  const operationalBottlenecks = useMemo(() => ({
    blocked: filteredLeads.filter(isLeadBlocked).length,
    inconsistent: filteredLeads.filter(hasOperationalInconsistency).length,
    slaCritical: slaAlerts.filter((a) => a.hoursInStatus >= 48).length,
    slaWarning: slaAlerts.filter((a) => a.hoursInStatus >= 24 && a.hoursInStatus < 48).length,
  }), [filteredLeads, slaAlerts]);

  const criticalPendencies = useMemo(() => {
    const byLead = new Map<string, { leadId: string; nomeEscritorio: string; reason: string; severity: number }>();
    slaAlerts.forEach((a) => byLead.set(a.leadId, { leadId: a.leadId, nomeEscritorio: a.nomeEscritorio, reason: `SLA ${a.hoursInStatus}h em ${a.statusAtual}`, severity: a.hoursInStatus >= 48 ? 3 : 2 }));
    followupsDue.forEach((f) => { const prev = byLead.get(f.leadId); const next = { leadId: f.leadId, nomeEscritorio: f.nomeEscritorio, reason: `Follow-up vencido (${f.followupType})`, severity: 2 }; if (!prev || next.severity >= prev.severity) byLead.set(f.leadId, next); });
    retentionDue.forEach((r) => { const prev = byLead.get(r.leadId); const next = { leadId: r.leadId, nomeEscritorio: r.nomeEscritorio, reason: `Retenção vencida há ${r.daysOverdue} dia(s)`, severity: 2 }; if (!prev || next.severity >= prev.severity) byLead.set(r.leadId, next); });
    return Array.from(byLead.values()).sort((a, b) => b.severity - a.severity || a.nomeEscritorio.localeCompare(b.nomeEscritorio, 'pt-BR')).slice(0, 8);
  }, [slaAlerts, followupsDue, retentionDue]);

  const unifiedTimeline = useMemo(() => {
    if (!selectedLead) return [] as Array<{ id: string; type: 'transition' | 'integration'; at: string; title: string; subtitle?: string }>;
    const transitions = timeline.map((e) => ({ id: `t-${e.id}`, type: 'transition' as const, at: e.createdAt, title: `${e.statusOrigem} → ${e.statusDestino}`, subtitle: e.observacao || e.actor || undefined }));
    const integrations = integrationEvents.map((e) => ({ id: `i-${e.id}`, type: 'integration' as const, at: e.occurredAt, title: `${e.channel} · ${e.eventType}`, subtitle: e.externalEventId ? `external: ${e.externalEventId}` : undefined }));
    return [...transitions, ...integrations].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [selectedLead, timeline, integrationEvents]);

  return {
    // data
    leads, kpis, slaAlerts, dailySummary, dispatchHealth, followupsDue, retentionDue,
    // ui state
    loading, saving, novoLeadOpen, setNovoLeadOpen, editarLeadOpen, setEditarLeadOpen,
    selectedLead, setSelectedLead, draggingLeadId, setDraggingLeadId, hoverColumn, setHoverColumn,
    pendingTransition, setPendingTransition,
    concluirDiagLead, setConcluirDiagLead, observacaoDiag, setObservacaoDiag,
    pendingDeleteLead, setPendingDeleteLead,
    deleteConfirmText, setDeleteConfirmText, deleteReason, setDeleteReason,
    transitionReason, setTransitionReason, transitionDate, setTransitionDate,
    statusMessage, setStatusMessage, error, setError,
    // filters
    search, setSearch, blockedOnly, setBlockedOnly, inconsistentOnly, setInconsistentOnly,
    origemFilter, setOrigemFilter, responsavelFilter, setResponsavelFilter,
    statusFilter, setStatusFilter, kpiRange, setKpiRange, sortBy, setSortBy, page, setPage,
    // derived
    filteredLeads, leadsByStatus, executiveFunnel, operationalBottlenecks, criticalPendencies, unifiedTimeline, responsavelOptions,
    // helpers
    isLeadBlocked, hasOperationalInconsistency, getAdvanceGuard,
    // actions
    onMoveLead, handleDropToColumn, requestSpecialTransition, confirmSpecialTransition,
    requestConcluirDiag, confirmConcluirDiag,
    onDeleteLeadPermanently, onDispatchByStage, onTriggerFollowup, onSubmitBriefing,
    onGenerateBriefingLink, onUpdateProofs, onUpdateOnboarding, onUpdatePrivacy,
    exportFilteredLeadsCsv,
    fetchLeads,
    pageSize: PAGE_SIZE,
  };
}
