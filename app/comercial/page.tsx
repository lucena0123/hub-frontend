'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { X } from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import {
  CommercialDashboard,
  CommercialLead,
  CommercialLeadStatus,
  createCommercialLead,
  getCommercialDashboard,
  getCommercialLeads,
  moveCommercialLead,
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

const getApiErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof AxiosError) {
    const payload = err.response?.data as { message?: string } | undefined;
    if (payload?.message) return payload.message;
  }
  return fallback;
};

export default function ComercialPage() {
  const [leads, setLeads] = useState<CommercialLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kpis, setKpis] = useState<CommercialDashboard>({ total: 0, novos: 0, diagnosticos: 0, propostas: 0, fechados: 0 });
  const [nomeEscritorio, setNomeEscritorio] = useState('');
  const [origem, setOrigem] = useState<'instagram' | 'indicacao' | 'site' | 'whatsapp' | 'outro'>('instagram');
  const [responsavel, setResponsavel] = useState('Matheus');
  const [search, setSearch] = useState('');
  const [origemFilter, setOrigemFilter] = useState<'all' | 'instagram' | 'indicacao' | 'site' | 'whatsapp' | 'outro'>('all');
  const [responsavelFilter, setResponsavelFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CommercialLeadStatus>('all');
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
      const [data, dashboard] = await Promise.all([
        getCommercialLeads({
          status: statusFilter === 'all' ? undefined : statusFilter,
          responsavel: responsavelFilter === 'all' ? undefined : responsavelFilter,
          limit: pageSize,
          offset: (page - 1) * pageSize,
        }),
        getCommercialDashboard(),
      ]);
      setLeads(data);
      setKpis(dashboard);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Falha ao carregar pipeline.'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, responsavelFilter, page]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, responsavelFilter, origemFilter, search]);

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

  const requestSpecialTransition = (lead: CommercialLead, to: 'nutricao' | 'perdido') => {
    setPendingTransition({ lead, to });
    setTransitionReason('');
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

  const handleDropToColumn = async (targetStatus: CommercialLeadStatus, leadId?: string) => {
    const effectiveLeadId = leadId || draggingLeadId;
    if (!effectiveLeadId) return;

    const lead = leads.find((item) => item.leadId === effectiveLeadId);
    if (!lead) return;
    if (lead.statusAtual === targetStatus) return;

    await onMoveLead(lead, targetStatus);
  };

  const responsavelOptions = useMemo(() => {
    return Array.from(new Set(leads.map((lead) => lead.responsavel).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [leads]);

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
      return true;
    });

    if (sortBy === 'name_asc') {
      return [...base].sort((a, b) => a.nomeEscritorio.localeCompare(b.nomeEscritorio, 'pt-BR'));
    }

    return base;
  }, [leads, statusFilter, origemFilter, responsavelFilter, search, sortBy]);

  const leadsByStatus = useMemo(() => {
    const grouped: Record<string, CommercialLead[]> = {};
    for (const col of COLUMNS) grouped[col.key] = [];

    for (const lead of filteredLeads) grouped[lead.statusAtual]?.push(lead);

    return grouped;
  }, [filteredLeads]);

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
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-[0.15em]">Filtros</span>
          <span className="text-[11px] text-muted-foreground">Exibindo {filteredLeads.length} de {leads.length} · Página {page}</span>
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

      <section className="grid grid-cols-2 md:grid-cols-5 gap-2">
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
      </section>

      <div className="grid grid-cols-1 2xl:grid-cols-[1fr_340px] gap-4 items-start">
        {loading ? (
          <div className="text-sm text-muted-foreground">Carregando pipeline...</div>
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
                        {next && (
                          <button
                            className="w-full h-7 rounded-md border border-primary/50 text-primary text-xs hover:bg-primary/10 disabled:opacity-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveLead(lead, next);
                            }}
                            disabled={saving}
                          >
                            Avançar para {COLUMNS.find((c) => c.key === next)?.label}
                          </button>
                        )}
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

              <div className="pt-2 grid grid-cols-1 gap-2">
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

            <textarea
              className="w-full min-h-[84px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              placeholder="Motivo da transição"
              value={transitionReason}
              onChange={(e) => setTransitionReason(e.target.value)}
            />

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
