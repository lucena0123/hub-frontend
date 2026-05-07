'use client';

import { PageShell } from '@/components/layout/page-shell';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { NovoLeadDialog } from '@/components/comercial/novo-lead-dialog';
import { EditarLeadDialog } from '@/components/comercial/editar-lead-dialog';
import { SkeletonRow } from '@/components/ui/skeleton';
import { Plus, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useComercial } from '@/features/commercial/hooks/use-comercial';
import { CompleteDiagnosisDialog, DeleteLeadDialog, SpecialTransitionDialog } from '@/features/commercial/components/commercial-dialogs';
import { ErrorBanner, StatusMessageBanner } from '@/features/commercial/components/feedback-banners';
import { KanbanBoard } from '@/features/commercial/components/kanban-board';
import { LeadDetailPanel } from '@/features/commercial/components/lead-detail-panel';
import { PipelineFilters } from '@/features/commercial/components/pipeline-filters';
import {
  CriticalPendenciesSection,
  DailySummarySection,
  DispatchHealthSection,
  FollowupsDueSection,
  RetentionDueSection,
} from '@/features/commercial/components/pipeline-alerts';
import { ExecutiveFunnelSection, PipelineKpiSection } from '@/features/commercial/components/pipeline-metrics';

export default function ComercialPage() {
  const { user } = useAuth();
  const canManageSensitive = user?.role === 'admin' || user?.role === 'manager';

  const state = useComercial();

  const {
    leads, kpis, dailySummary, dispatchHealth, followupsDue, retentionDue, leadRequirements, leadAssets,
    loading, saving, novoLeadOpen, setNovoLeadOpen, editarLeadOpen, setEditarLeadOpen,
    selectedLead, setSelectedLead, draggingLeadId, setDraggingLeadId, hoverColumn, setHoverColumn,
    pendingTransition, setPendingTransition,
    concluirDiagLead, setConcluirDiagLead, observacaoDiag, setObservacaoDiag,
    pendingDeleteLead, setPendingDeleteLead,
    deleteConfirmText, setDeleteConfirmText, deleteReason, setDeleteReason,
    transitionReason, setTransitionReason, transitionDate, setTransitionDate,
    statusMessage, setStatusMessage, error, setError, errorAction, setErrorAction, leadMetaLoading,
    search, setSearch, blockedOnly, setBlockedOnly, inconsistentOnly, setInconsistentOnly,
    origemFilter, setOrigemFilter, responsavelFilter, setResponsavelFilter,
    statusFilter, setStatusFilter, kpiRange, setKpiRange, sortBy, setSortBy, page, setPage,
    filteredLeads, leadsByStatus, executiveFunnel, operationalBottlenecks, criticalPendencies,
    unifiedTimeline, responsavelOptions,
    isLeadBlocked, hasOperationalInconsistency, getAdvanceGuard,
    onMoveLead, handleDropToColumn, confirmSpecialTransition,
    requestConcluirDiag, confirmConcluirDiag,
    onDeleteLeadPermanently, onDispatchByStage, onTriggerFollowup, onSubmitBriefing,
    onGenerateBriefingLink, onSendSchedulingInvite, onUpdateProofs, onUpdateOnboarding, onUpdatePrivacy,
    onUpdateRequirementStatus, onAddLeadAsset, onRunCalendarSync,
    exportFilteredLeadsCsv, fetchLeads, pageSize,
  } = state;

  const hasActiveFilters = search || blockedOnly || inconsistentOnly || origemFilter !== 'all' || responsavelFilter !== 'all' || statusFilter !== 'all';
  const actionLead = errorAction
    ? leads.find((lead) => lead.leadId === errorAction.leadId) || null
    : null;

  return (
    <>
      {/* Main page content */}
      <div className={cn('transition-all duration-200', selectedLead ? 'mr-[360px] xl:mr-[400px]' : '')}>
        <PageShell
          breadcrumb={[{ label: 'Agência', href: '/' }, { label: 'Comercial' }]}
          title="Pipeline Comercial"
          description="Captação → Diagnóstico → Proposta → Fechamento"
          actions={
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" className="cursor-pointer">
                <Link href="/comercial/configuracoes">
                  Configurações
                </Link>
              </Button>
              <Button onClick={() => setNovoLeadOpen(true)} className="gap-2 cursor-pointer">
                <Plus className="h-4 w-4" />
                Novo Lead
              </Button>
            </div>
          }
        >
          {/* ── Status messages ─────────────────────────────────────────── */}
          {statusMessage && (
            <StatusMessageBanner message={statusMessage} onClose={() => setStatusMessage(null)} />
          )}
          {error && (
            <ErrorBanner
              error={error}
              errorAction={errorAction}
              actionLead={actionLead}
              saving={saving}
              onClose={() => { setError(null); setErrorAction(null); }}
              onSendSchedulingInvite={onSendSchedulingInvite}
              onRunCalendarSync={onRunCalendarSync}
            />
          )}

          {/* ── KPI strip ────────────────────────────────────────────────── */}
          <PipelineKpiSection kpis={kpis} kpiRange={kpiRange} onKpiRangeChange={setKpiRange} />

          {/* ── Executive funnel ─────────────────────────────────────────── */}
          <ExecutiveFunnelSection
            executiveFunnel={executiveFunnel}
            totalLeads={leads.length}
            operationalBottlenecks={operationalBottlenecks}
          />

          <DailySummarySection dailySummary={dailySummary} />
          <DispatchHealthSection dispatchHealth={dispatchHealth} />
          <RetentionDueSection retentionDue={retentionDue} />
          <CriticalPendenciesSection
            criticalPendencies={criticalPendencies}
            leads={leads}
            onSelectLead={setSelectedLead}
          />
          <FollowupsDueSection
            followupsDue={followupsDue}
            saving={saving}
            onTriggerFollowup={onTriggerFollowup}
          />

          {/* ── Filters ──────────────────────────────────────────────────── */}
          <PipelineFilters
            search={search}
            blockedOnly={blockedOnly}
            inconsistentOnly={inconsistentOnly}
            origemFilter={origemFilter}
            responsavelFilter={responsavelFilter}
            statusFilter={statusFilter}
            sortBy={sortBy}
            page={page}
            loading={loading}
            totalLeads={leads.length}
            filteredCount={filteredLeads.length}
            pageSize={pageSize}
            responsavelOptions={responsavelOptions}
            hasActiveFilters={Boolean(hasActiveFilters)}
            onSearchChange={setSearch}
            onBlockedOnlyChange={setBlockedOnly}
            onInconsistentOnlyChange={setInconsistentOnly}
            onOrigemFilterChange={setOrigemFilter}
            onResponsavelFilterChange={setResponsavelFilter}
            onStatusFilterChange={setStatusFilter}
            onSortByChange={setSortBy}
            onPageChange={setPage}
            onClearFilters={() => {
              setSearch('');
              setBlockedOnly(false);
              setInconsistentOnly(false);
              setOrigemFilter('all');
              setResponsavelFilter('all');
              setStatusFilter('all');
            }}
            onExportCsv={exportFilteredLeadsCsv}
          />

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
              onSetError={(msg) => { setError(msg); setErrorAction(null); }}
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
        leadMetaLoading={leadMetaLoading}
        requirements={leadRequirements}
        assets={leadAssets}
        unifiedTimeline={unifiedTimeline}
        canManageSensitive={canManageSensitive}
        onClose={() => setSelectedLead(null)}
        onEdit={() => setEditarLeadOpen(true)}
        onDelete={(lead) => { setPendingDeleteLead(lead); setDeleteConfirmText(''); setDeleteReason(''); }}
        onDispatch={onDispatchByStage}
        onSendSchedulingInvite={onSendSchedulingInvite}
        onGenerateBriefingLink={onGenerateBriefingLink}
        onSubmitBriefing={onSubmitBriefing}
        onUpdatePrivacy={(lead, update) => onUpdatePrivacy(lead, update)}
        onUpdateProofs={(lead, update) => onUpdateProofs(lead, update)}
        onUpdateOnboarding={(lead, update) => onUpdateOnboarding(lead, update)}
        onUpdateRequirementStatus={onUpdateRequirementStatus}
        onAddAsset={onAddLeadAsset}
        onRunCalendarSync={onRunCalendarSync}
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

      <SpecialTransitionDialog
        pendingTransition={pendingTransition}
        saving={saving}
        transitionReason={transitionReason}
        transitionDate={transitionDate}
        onOpenChange={(open) => !open && setPendingTransition(null)}
        onTransitionReasonChange={setTransitionReason}
        onTransitionDateChange={setTransitionDate}
        onConfirm={confirmSpecialTransition}
      />
      <CompleteDiagnosisDialog
        lead={concluirDiagLead}
        saving={saving}
        observacaoDiag={observacaoDiag}
        onOpenChange={(open) => !open && setConcluirDiagLead(null)}
        onObservacaoDiagChange={setObservacaoDiag}
        onConfirm={confirmConcluirDiag}
      />
      <DeleteLeadDialog
        lead={pendingDeleteLead}
        saving={saving}
        deleteConfirmText={deleteConfirmText}
        deleteReason={deleteReason}
        onOpenChange={(open) => !open && setPendingDeleteLead(null)}
        onDeleteConfirmTextChange={setDeleteConfirmText}
        onDeleteReasonChange={setDeleteReason}
        onConfirm={onDeleteLeadPermanently}
      />
    </>
  );
}
