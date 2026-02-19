'use client';

import { useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { X } from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import {
  CommercialLead,
  CommercialLeadStatus,
  createCommercialLead,
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
  const [nomeEscritorio, setNomeEscritorio] = useState('');
  const [origem, setOrigem] = useState<'instagram' | 'indicacao' | 'site' | 'whatsapp' | 'outro'>('instagram');
  const [responsavel, setResponsavel] = useState('Matheus');
  const [statusFilter, setStatusFilter] = useState<'all' | CommercialLeadStatus>('all');
  const [selectedLead, setSelectedLead] = useState<CommercialLead | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await getCommercialLeads();
      setLeads(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Falha ao carregar pipeline.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const onCreateLead = async () => {
    try {
      setSaving(true);
      setError(null);
      await createCommercialLead({ nomeEscritorio, origem, responsavel });
      setNomeEscritorio('');
      await fetchLeads();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Falha ao criar lead.'));
    } finally {
      setSaving(false);
    }
  };

  const onMoveLead = async (lead: CommercialLead, to: CommercialLeadStatus) => {
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
        payload.motivoNutricao = 'Lead em acompanhamento';
        payload.dataProximaAcao = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
      }
      if (to === 'perdido') {
        payload.motivoPerda = 'Sem avanço na negociação';
      }
      await moveCommercialLead(lead.leadId, payload);
      await fetchLeads();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Falha ao mover lead.'));
    } finally {
      setSaving(false);
    }
  };

  const leadsByStatus = useMemo(() => {
    const grouped: Record<string, CommercialLead[]> = {};
    for (const col of COLUMNS) grouped[col.key] = [];

    const baseLeads = statusFilter === 'all' ? leads : leads.filter((lead) => lead.statusAtual === statusFilter);
    for (const lead of baseLeads) grouped[lead.statusAtual]?.push(lead);

    return grouped;
  }, [leads, statusFilter]);

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
        {error && <p className="text-xs text-destructive">{error}</p>}
      </section>

      <section className="rounded-[12px] border border-border/60 bg-card/20 p-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground uppercase tracking-[0.15em]">Filtro</span>
        <select
          className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | CommercialLeadStatus)}
        >
          <option value="all">Todos</option>
          {COLUMNS.map((col) => (
            <option key={col.key} value={col.key}>{col.label}</option>
          ))}
        </select>
      </section>

      <div className="grid grid-cols-1 2xl:grid-cols-[1fr_340px] gap-4 items-start">
        {loading ? (
          <div className="text-sm text-muted-foreground">Carregando pipeline...</div>
        ) : (
          <section className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-9 gap-3">
            {COLUMNS.map((col) => (
              <div key={col.key} className="rounded-[12px] border border-border/60 bg-card/30 p-3 space-y-2 min-h-[220px]">
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
                    onClick={() => onMoveLead(selectedLead, 'nutricao')}
                  >
                    Mover para Nutrição
                  </button>
                )}
                {selectedLead.statusAtual !== 'perdido' && selectedLead.statusAtual !== 'fechado' && (
                  <button
                    className="h-8 rounded-md border border-destructive/60 text-destructive text-xs hover:bg-destructive/10"
                    disabled={saving}
                    onClick={() => onMoveLead(selectedLead, 'perdido')}
                  >
                    Marcar como Perdido
                  </button>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </PageShell>
  );
}
