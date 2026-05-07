'use client';

import { useCallback } from 'react';

import {
  CommercialLead,
  CommercialLeadStatus,
  moveCommercialLead,
} from '@/lib/api/client/commercial';
import {
  COLUMNS,
  LOSS_REASONS,
  NURTURE_REASONS,
  getAdvanceGuard as evaluateAdvanceGuard,
  toApiErrorWithReason,
  type ComercialErrorAction,
  type ConcluirDiagLead,
  type PendingTransition,
} from '../model';
import {
  buildMoveLeadPayload,
  buildSpecialTransitionOptions,
  resolveMoveLeadErrorAction,
  type MoveLeadOptions,
} from '../lead-transition-helpers';

interface UseCommercialTransitionsParams {
  canManageSensitive: boolean;
  concluirDiagLead: ConcluirDiagLead | null;
  draggingLeadId: string | null;
  fetchLeads: () => Promise<void>;
  leads: CommercialLead[];
  observacaoDiag: string;
  pendingTransition: PendingTransition | null;
  setConcluirDiagLead: (lead: ConcluirDiagLead | null) => void;
  setError: (message: string | null) => void;
  setErrorAction: (action: ComercialErrorAction) => void;
  setObservacaoDiag: (value: string) => void;
  setPendingTransition: (transition: PendingTransition | null) => void;
  setSaving: (value: boolean) => void;
  setStatusMessage: (message: string | null) => void;
  setTransitionDate: (value: string) => void;
  setTransitionReason: (value: string) => void;
  transitionDate: string;
  transitionReason: string;
}

export function useCommercialTransitions({
  canManageSensitive,
  concluirDiagLead,
  draggingLeadId,
  fetchLeads,
  leads,
  observacaoDiag,
  pendingTransition,
  setConcluirDiagLead,
  setError,
  setErrorAction,
  setObservacaoDiag,
  setPendingTransition,
  setSaving,
  setStatusMessage,
  setTransitionDate,
  setTransitionReason,
  transitionDate,
  transitionReason,
}: UseCommercialTransitionsParams) {
  const onMoveLead = async (
    lead: CommercialLead,
    to: CommercialLeadStatus,
    options?: MoveLeadOptions,
  ) => {
    try {
      setSaving(true);
      setError(null);
      setErrorAction(null);
      const payload = buildMoveLeadPayload(to, options);
      await moveCommercialLead(lead.leadId, payload as unknown as Parameters<typeof moveCommercialLead>[1]);
      setStatusMessage(`Lead movido para ${COLUMNS.find((c) => c.key === to)?.label}.`);
      await fetchLeads();
    } catch (err) {
      const apiError = toApiErrorWithReason(err, 'Falha ao mover lead.');
      setError(apiError.message);
      setErrorAction(resolveMoveLeadErrorAction({ leadId: lead.leadId, reasonCode: apiError.reasonCode, to }));
    } finally {
      setSaving(false);
    }
  };

  const handleDropToColumn = async (targetStatus: CommercialLeadStatus, leadId?: string) => {
    const id = leadId || draggingLeadId;
    if (!id) return;
    const lead = leads.find((item) => item.leadId === id);
    if (!lead || lead.statusAtual === targetStatus) return;
    const guard = evaluateAdvanceGuard(lead, targetStatus, canManageSensitive);
    if (!guard.ok) {
      setError(guard.reason || 'Ação bloqueada.');
      return;
    }
    await onMoveLead(lead, targetStatus);
  };

  const requestSpecialTransition = (lead: CommercialLead, to: 'nutricao' | 'perdido') => {
    setPendingTransition({ lead, to });
    setTransitionReason(to === 'nutricao' ? NURTURE_REASONS[0] : LOSS_REASONS[0]);
    setTransitionDate('');
  };

  const confirmSpecialTransition = async () => {
    if (!pendingTransition || !transitionReason.trim()) {
      setError('Informe o motivo para continuar.');
      return;
    }
    if (pendingTransition.to === 'nutricao' && !transitionDate) {
      setError('Informe a data da próxima ação.');
      return;
    }
    await onMoveLead(pendingTransition.lead, pendingTransition.to, buildSpecialTransitionOptions(pendingTransition, transitionReason, transitionDate));
    setPendingTransition(null);
    setTransitionReason('');
    setTransitionDate('');
  };

  const requestConcluirDiag = (lead: CommercialLead) => {
    setConcluirDiagLead(lead);
    setObservacaoDiag('');
  };

  const confirmConcluirDiag = async () => {
    if (!concluirDiagLead) return;
    if (observacaoDiag.trim().length < 10) {
      setError('Resumo deve ter ao menos 10 caracteres.');
      return;
    }
    await onMoveLead(concluirDiagLead, 'diagnostico_concluido', { observacao: observacaoDiag.trim() });
    setConcluirDiagLead(null);
    setObservacaoDiag('');
  };

  const getAdvanceGuard = useCallback(
    (lead: CommercialLead, targetStatus: CommercialLeadStatus) =>
      evaluateAdvanceGuard(lead, targetStatus, canManageSensitive),
    [canManageSensitive],
  );

  return {
    confirmConcluirDiag,
    confirmSpecialTransition,
    getAdvanceGuard,
    handleDropToColumn,
    onMoveLead,
    requestConcluirDiag,
    requestSpecialTransition,
  };
}
