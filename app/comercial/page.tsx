'use client';

import { PageShell } from '@/components/layout/page-shell';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { NovoLeadDialog } from '@/components/comercial/novo-lead-dialog';
import { EditarLeadDialog } from '@/components/comercial/editar-lead-dialog';
import { SkeletonRow } from '@/components/ui/skeleton';
import { AlertTriangle, Plus, CheckCircle, Download, ChevronLeft, ChevronRight, Filter, X, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useComercial, COLUMNS, NURTURE_REASONS, LOSS_REASONS } from './hooks/use-comercial';
import { KanbanBoard } from './components/kanban-board';
import { LeadDetailPanel } from './components/lead-detail-panel';

// ── KPI chip ─────────────────────────────────────────────────────────────────
function KpiChip({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/30 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={cn('text-xl font-semibold mt-1', accent)}>{value}</p>
    </div>
  );
}

// ── Funnel bar ────────────────────────────────────────────────────────────────
function FunnelBar({ label, value, total }: { label: string; value: number; total: number }) {
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
          style={{ '--bar-width': `${pct}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

export default function ComercialPage() {
  const { user } = useAuth();
  const canManageSensitive = user?.role === 'admin' || user?.role === 'manager';

  const state = useComercial();

  const {
    leads, kpis, slaAlerts, dailySummary, dispatchHealth, followupsDue, retentionDue,
    loading, saving, novoLeadOpen, setNovoLeadOpen, editarLeadOpen, setEditarLeadOpen,
    selectedLead, setSelectedLead, draggingLeadId, setDraggingLeadId, hoverColumn, setHoverColumn,
    pendingTransition, setPendingTransition,
    concluirDiagLead, setConcluirDiagLead, observacaoDiag, setObservacaoDiag,
    pendingDeleteLead, setPendingDeleteLead,
    deleteConfirmText, setDeleteConfirmText, deleteReason, setDeleteReason,
    transitionReason, setTransitionReason, transitionDate, setTransitionDate,
    statusMessage, setStatusMessage, error, setError,
    search, setSearch, blockedOnly, setBlockedOnly, inconsistentOnly, setInconsistentOnly,
    origemFilter, setOrigemFilter, responsavelFilter, setResponsavelFilter,
    statusFilter, setStatusFilter, kpiRange, setKpiRange, sortBy, setSortBy, page, setPage,
    filteredLeads, leadsByStatus, executiveFunnel, operationalBottlenecks, criticalPendencies,
    unifiedTimeline, responsavelOptions,
    isLeadBlocked, hasOperationalInconsistency, getAdvanceGuard,
    onMoveLead, handleDropToColumn, requestSpecialTransition, confirmSpecialTransition,
    requestConcluirDiag, confirmConcluirDiag,
    onDeleteLeadPermanently, onDispatchByStage, onTriggerFollowup, onSubmitBriefing,
    onGenerateBriefingLink, onUpdateProofs, onUpdateOnboarding, onUpdatePrivacy,
    exportFilteredLeadsCsv, fetchLeads, pageSize,
  } = state;

  const hasActiveFilters = search || blockedOnly || inconsistentOnly || origemFilter !== 'all' || responsavelFilter !== 'all' || statusFilter !== 'all';

  return (
    <>
      {/* Main page content */}
      <div className={cn('transition-all duration-200', selectedLead ? 'mr-[360px] xl:mr-[400px]' : '')}>
        <PageShell
          breadcrumb={[{ label: 'Agência', href: '/' }, { label: 'Comercial' }]}
          title="Pipeline Comercial"
          description="Captação → Diagnóstico → Proposta → Fechamento"
          actions={
            <Button onClick={() => setNovoLeadOpen(true)} className="gap-2 cursor-pointer">
              <Plus className="h-4 w-4" />
              Novo Lead
            </Button>
          }
        >
          {/* ── Status messages ─────────────────────────────────────────── */}
          {statusMessage && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
              <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <p className="text-sm text-emerald-300 flex-1">{statusMessage}</p>
              <button type="button" onClick={() => setStatusMessage(null)} aria-label="Fechar mensagem" className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive flex-1">{error}</p>
              <button type="button" onClick={() => setError(null)} aria-label="Fechar erro" className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* ── KPI strip ────────────────────────────────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">KPIs do Pipeline</p>
              <select
                aria-label="Período dos KPIs"
                className="h-7 rounded-lg border border-input bg-transparent px-2 text-xs cursor-pointer"
                value={kpiRange}
                onChange={(e) => setKpiRange(e.target.value === 'all' ? 'all' : (Number(e.target.value) as 7 | 30))}
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

          {/* ── Executive funnel ─────────────────────────────────────────── */}
          <section className="rounded-2xl border border-border/50 bg-card/20 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Resumo Executivo</p>
              <span className="text-xs text-muted-foreground">
                Fechamento: <strong className="text-foreground">{executiveFunnel.taxaFechamento.toFixed(1)}%</strong>
              </span>
            </div>
            <div className="space-y-2">
              <FunnelBar label="1º Contato" value={executiveFunnel.primeiroContato} total={leads.length} />
              <FunnelBar label="Diagnóstico" value={executiveFunnel.diagnostico} total={leads.length} />
              <FunnelBar label="Proposta" value={executiveFunnel.proposta} total={leads.length} />
              <FunnelBar label="Negociação" value={executiveFunnel.negociacao} total={leads.length} />
              <FunnelBar label="Fechado" value={executiveFunnel.fechado} total={leads.length} />
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

          {/* ── Daily summary ─────────────────────────────────────────────── */}
          {criticalPendencies.length > 0 && (
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
                    onClick={() => { const found = leads.find((l) => l.leadId === item.leadId); if (found) setSelectedLead(found); }}
                  >
                    <p className="text-xs font-medium text-foreground">{item.nomeEscritorio}</p>
                    <p className="text-[11px] text-muted-foreground">{item.reason}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── Follow-ups vencidos ────────────────────────────────────────── */}
          {followupsDue.length > 0 && (
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
          )}

          {/* ── Filters ──────────────────────────────────────────────────── */}
          <section className="rounded-2xl border border-border/50 bg-card/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Filtros</p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => { setSearch(''); setBlockedOnly(false); setInconsistentOnly(false); setOrigemFilter('all'); setResponsavelFilter('all'); setStatusFilter('all'); }}
                    className="text-[11px] text-primary hover:underline cursor-pointer"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {filteredLeads.length} de {leads.length} leads · Pág. {page}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              <div className="relative lg:col-span-2">
                <Input
                  placeholder="Buscar escritório, origem ou resp..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 text-xs pl-3"
                  aria-label="Buscar leads"
                />
              </div>

              <select aria-label="Filtrar por status" className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs cursor-pointer" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
                <option value="all">Status: Todos</option>
                {COLUMNS.map((col) => <option key={col.key} value={col.key}>{col.label}</option>)}
              </select>

              <select aria-label="Filtrar por origem" className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs cursor-pointer" value={origemFilter} onChange={(e) => setOrigemFilter(e.target.value as typeof origemFilter)}>
                <option value="all">Origem: Todas</option>
                <option value="instagram">Instagram</option>
                <option value="indicacao">Indicação</option>
                <option value="site">Site</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="outro">Outro</option>
              </select>

              <select aria-label="Filtrar por responsável" className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs cursor-pointer" value={responsavelFilter} onChange={(e) => setResponsavelFilter(e.target.value)}>
                <option value="all">Responsável: Todos</option>
                {responsavelOptions.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setBlockedOnly((p) => !p)} className={cn('h-7 px-2 rounded-lg border text-[11px] transition-colors cursor-pointer', blockedOnly ? 'border-amber-500/60 text-amber-300 bg-amber-500/10' : 'border-border text-muted-foreground hover:border-border/80')}>
                  {blockedOnly ? '× Bloqueados ON' : 'Bloqueados'}
                </button>
                <button type="button" onClick={() => setInconsistentOnly((p) => !p)} className={cn('h-7 px-2 rounded-lg border text-[11px] transition-colors cursor-pointer', inconsistentOnly ? 'border-rose-500/60 text-rose-300 bg-rose-500/10' : 'border-border text-muted-foreground hover:border-border/80')}>
                  {inconsistentOnly ? '× Inconsistentes ON' : 'Inconsistentes'}
                </button>
                <select aria-label="Ordenação" className="h-7 rounded-lg border border-input bg-transparent px-2 text-[11px] cursor-pointer" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
                  <option value="updated_desc">Mais recente</option>
                  <option value="name_asc">Nome A-Z</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-7 text-[11px] cursor-pointer" disabled={filteredLeads.length === 0} onClick={exportFilteredLeadsCsv}>
                  <Download className="h-3 w-3 mr-1" /> CSV
                </Button>
                <Button aria-label="Página anterior" variant="outline" size="sm" className="h-7 w-7 p-0 cursor-pointer" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button aria-label="Próxima página" variant="outline" size="sm" className="h-7 w-7 p-0 cursor-pointer" disabled={loading || leads.length < pageSize} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </section>

          {/* ── Kanban ───────────────────────────────────────────────────── */}
          {loading ? (
            <section className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} className="rounded-xl border border-border/40 bg-card/20" />)}
            </section>
          ) : filteredLeads.length === 0 ? (
            <section className="rounded-2xl border border-border/50 bg-card/20 p-10 flex flex-col items-center gap-4">
              <UserPlus className="h-10 w-10 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">Nenhum lead com os filtros atuais</p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={() => { setSearch(''); setOrigemFilter('all'); setResponsavelFilter('all'); setStatusFilter('all'); setBlockedOnly(false); setInconsistentOnly(false); }}>
                  Limpar filtros
                </Button>
              )}
            </section>
          ) : (
            <KanbanBoard
              leadsByStatus={leadsByStatus}
              selectedLead={selectedLead}
              draggingLeadId={draggingLeadId}
              hoverColumn={hoverColumn}
              saving={saving}
              isLeadBlocked={isLeadBlocked}
              hasOperationalInconsistency={hasOperationalInconsistency}
              getAdvanceGuard={getAdvanceGuard}
              onSelectLead={setSelectedLead}
              onMoveLead={(lead, to) => {
                if (to === 'diagnostico_concluido') { requestConcluirDiag(lead); return; }
                onMoveLead(lead, to);
              }}
              onSetError={setError}
              onDragStart={setDraggingLeadId}
              onDragEnd={() => { setDraggingLeadId(null); setHoverColumn(null); }}
              onDrop={handleDropToColumn}
              onHoverColumn={setHoverColumn}
            />
          )}
        </PageShell>
      </div>

      {/* ── Lead detail panel (fixed right) ─────────────────────────────── */}
      <LeadDetailPanel
        lead={selectedLead}
        saving={saving}
        unifiedTimeline={unifiedTimeline}
        canManageSensitive={canManageSensitive}
        onClose={() => setSelectedLead(null)}
        onEdit={() => setEditarLeadOpen(true)}
        onDelete={(lead) => { setPendingDeleteLead(lead); setDeleteConfirmText(''); setDeleteReason(''); }}
        onDispatch={onDispatchByStage}
        onGenerateBriefingLink={onGenerateBriefingLink}
        onSubmitBriefing={onSubmitBriefing}
        onUpdatePrivacy={(lead, update) => onUpdatePrivacy(lead, update)}
        onUpdateProofs={(lead, update) => onUpdateProofs(lead, update)}
      />

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      <NovoLeadDialog
        open={novoLeadOpen}
        onOpenChange={setNovoLeadOpen}
        onCreated={() => { fetchLeads(); setStatusMessage('Lead criado com sucesso.'); }}
      />

      <EditarLeadDialog
        lead={selectedLead}
        open={editarLeadOpen}
        onOpenChange={setEditarLeadOpen}
        onUpdated={(updated) => {
          fetchLeads();
          setSelectedLead(updated);
          setStatusMessage('Lead atualizado com sucesso.');
        }}
      />

      {/* Special transition dialog */}
      <Dialog open={!!pendingTransition} onOpenChange={(open) => !open && setPendingTransition(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Mover para {pendingTransition?.to === 'nutricao' ? 'Nutrição' : 'Perdido'}
            </DialogTitle>
            <DialogDescription>
              {pendingTransition?.to === 'nutricao'
                ? 'Lead será mantido para acompanhamento futuro.'
                : 'Lead será arquivado como oportunidade perdida.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Motivo *</label>
              <select
                id="transition-reason"
                aria-label="Motivo da transição"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm cursor-pointer"
                value={transitionReason}
                onChange={(e) => setTransitionReason(e.target.value)}
              >
                {(pendingTransition?.to === 'nutricao' ? NURTURE_REASONS : LOSS_REASONS).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            {pendingTransition?.to === 'nutricao' && (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Data da próxima ação *</label>
                <input
                  type="date"
                  id="transition-date"
                  aria-label="Data da próxima ação"
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                  value={transitionDate}
                  onChange={(e) => setTransitionDate(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingTransition(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={confirmSpecialTransition} disabled={saving}>
              {saving ? 'Aguarde...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Concluir Diagnóstico dialog */}
      <Dialog open={!!concluirDiagLead} onOpenChange={(open) => !open && setConcluirDiagLead(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Concluir Diagnóstico</DialogTitle>
            <DialogDescription>
              Registre o resumo e evidências do diagnóstico com <strong>{concluirDiagLead?.nomeEscritorio}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Resumo do diagnóstico * <span className="text-muted-foreground/60">(mín. 10 caracteres)</span></label>
              <textarea
                className="w-full min-h-[120px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Ex: Lead demonstrou interesse em campanhas de tráfego pago. Escritório com 3 advogados, área trabalhista. Budget estimado R$ 3k/mês."
                value={observacaoDiag}
                onChange={(e) => setObservacaoDiag(e.target.value)}
              />
              <p className={cn(
                'text-[10px] text-right',
                observacaoDiag.trim().length >= 10 ? 'text-emerald-400' : 'text-muted-foreground/60',
              )}>
                {observacaoDiag.trim().length} caracteres {observacaoDiag.trim().length >= 10 ? '✓' : `(faltam ${10 - observacaoDiag.trim().length})`}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConcluirDiagLead(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={confirmConcluirDiag}
              disabled={saving || observacaoDiag.trim().length < 10}
            >
              {saving ? 'Aguarde...' : 'Confirmar conclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete lead dialog */}
      <Dialog open={!!pendingDeleteLead} onOpenChange={(open) => !open && setPendingDeleteLead(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              Excluir Lead Permanentemente
            </DialogTitle>
            <DialogDescription>
              Esta ação remove o lead <strong>{pendingDeleteLead?.nomeEscritorio}</strong> e todos os eventos associados. Esta ação é irreversível.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Digite <strong>EXCLUIR</strong> para confirmar</label>
              <Input
                placeholder="EXCLUIR"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Motivo (opcional)</label>
              <Input
                placeholder="Motivo da exclusão"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeleteLead(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={onDeleteLeadPermanently}
              disabled={saving || deleteConfirmText.trim() !== 'EXCLUIR'}
            >
              {saving ? 'Excluindo...' : 'Excluir Permanentemente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
