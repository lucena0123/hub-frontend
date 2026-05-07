'use client';

import {
  CommercialLead,
  ContractStatus,
  PaymentStatus,
  CommercialRequirementStatus,
  CommercialAsset,
  CommercialLeadStatus,
} from '@/lib/api/client/commercial';
import { cn } from '@/lib/utils';
import { X, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeadAssetsSection, RequirementChecklistSection } from './lead-detail-panel/governance-sections';
import {
  ContractPaymentSection,
  LeadTimelineSection,
  OnboardingSection,
  QuickDispatchSection,
} from './lead-detail-panel/operations-sections';
import {
  LeadContactSection,
  LeadIdentitySection,
  LeadProposalSection,
  LeadQualificationSection,
} from './lead-detail-panel/overview-sections';
import { LeadFormSection, PrivacyConsentSection, SchedulingSection } from './lead-detail-panel/workflow-sections';

interface LeadDetailPanelProps {
  lead: CommercialLead | null;
  saving: boolean;
  leadMetaLoading: boolean;
  requirements: CommercialRequirementStatus[];
  assets: CommercialAsset[];
  unifiedTimeline: Array<{ id: string; type: 'transition' | 'integration'; at: string; title: string; subtitle?: string }>;
  canManageSensitive: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: (lead: CommercialLead) => void;
  onDispatch: (lead: CommercialLead, channel: 'whatsapp' | 'gmail') => void;
  onSendSchedulingInvite: (lead: CommercialLead) => void;
  onGenerateBriefingLink: (lead: CommercialLead) => void;
  onSubmitBriefing: (lead: CommercialLead) => void;
  onUpdatePrivacy: (lead: CommercialLead, update: { consentGiven: boolean }) => void;
  onUpdateProofs: (lead: CommercialLead, update: { contractStatus?: ContractStatus; paymentStatus?: PaymentStatus }) => void;
  onUpdateOnboarding: (lead: CommercialLead, update: { d0Ok?: boolean; d1Ok?: boolean; d2Ok?: boolean; d3D4Ok?: boolean; d5D7Ok?: boolean }) => void;
  onUpdateRequirementStatus: (lead: CommercialLead, requirementKey: string, status: 'pending' | 'done' | 'waived') => void;
  onAddAsset: (lead: CommercialLead, payload: { stage: CommercialLeadStatus; assetType: string; url: string }) => void;
  onRunCalendarSync: (leadId?: string) => void;
}

export function LeadDetailPanel({
  lead,
  saving,
  leadMetaLoading,
  requirements,
  assets,
  unifiedTimeline,
  canManageSensitive,
  onClose,
  onEdit,
  onDelete,
  onDispatch,
  onSendSchedulingInvite,
  onGenerateBriefingLink,
  onSubmitBriefing,
  onUpdatePrivacy,
  onUpdateProofs,
  onUpdateOnboarding,
  onUpdateRequirementStatus,
  onAddAsset,
  onRunCalendarSync,
}: LeadDetailPanelProps) {
  const latestSchedulingOutcome = unifiedTimeline.find(
    (item) =>
      item.type === 'integration'
      && (
        item.title.includes('Convite interativo enviado')
        || item.title.includes('Confirmado por botão')
        || item.title.includes('Calendário aberto')
        || item.title.includes('Conflito de horário')
      ),
  );

  return (
    <aside
      className={cn(
        'fixed right-0 top-0 h-full z-30 flex flex-col bg-[#080808]/95 border-l border-border/40',
        '-webkit-backdrop-filter: blur(16px)',
        'backdrop-filter: blur(16px)',
        'transition-transform duration-200',
        lead ? 'translate-x-0 w-[360px] xl:w-[400px]' : 'translate-x-full w-[360px]',
      )}
      aria-label="Detalhes do lead"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 flex-shrink-0">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Detalhe do Lead</p>
        <div className="flex items-center gap-1">
          {lead && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs cursor-pointer"
                onClick={onEdit}
                title="Editar lead"
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Editar
              </Button>
              {canManageSensitive && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                  onClick={() => onDelete(lead)}
                  title="Excluir lead"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/6 cursor-pointer transition-colors"
            aria-label="Fechar painel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      {!lead ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-sm text-muted-foreground text-center">
            Selecione um lead no Kanban para ver os detalhes
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <LeadIdentitySection lead={lead} />
          <LeadContactSection lead={lead} />
          <LeadQualificationSection lead={lead} />

          <SchedulingSection
            lead={lead}
            saving={saving}
            latestSchedulingOutcome={latestSchedulingOutcome}
            onRunCalendarSync={onRunCalendarSync}
            onSendSchedulingInvite={onSendSchedulingInvite}
          />

          <LeadProposalSection lead={lead} />

          <LeadFormSection
            lead={lead}
            saving={saving}
            onGenerateBriefingLink={onGenerateBriefingLink}
            onSubmitBriefing={onSubmitBriefing}
          />
          <PrivacyConsentSection
            lead={lead}
            saving={saving}
            onUpdatePrivacy={onUpdatePrivacy}
          />

          <RequirementChecklistSection
            lead={lead}
            saving={saving}
            leadMetaLoading={leadMetaLoading}
            requirements={requirements}
            canManageSensitive={canManageSensitive}
            onUpdateRequirementStatus={onUpdateRequirementStatus}
          />
          <LeadAssetsSection
            lead={lead}
            saving={saving}
            leadMetaLoading={leadMetaLoading}
            assets={assets}
            onAddAsset={onAddAsset}
          />

          <OnboardingSection
            lead={lead}
            saving={saving}
            onUpdateOnboarding={onUpdateOnboarding}
          />
          <ContractPaymentSection
            lead={lead}
            saving={saving}
            onUpdateProofs={onUpdateProofs}
          />
          <QuickDispatchSection
            lead={lead}
            saving={saving}
            onDispatch={onDispatch}
          />
          <LeadTimelineSection unifiedTimeline={unifiedTimeline} />
        </div>
      )}
    </aside>
  );
}
