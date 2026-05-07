'use client';

import type { Dispatch, SetStateAction } from 'react';

import {
  CommercialLead,
  dispatchCommercialCommunication,
  deleteCommercialLead,
  getCommercialLeadFormLink,
  runCommercialCalendarSync,
  sendCommercialSchedulingInvite,
  submitCommercialForm,
  triggerCommercialFollowupDispatch,
  updateCommercialLeadOnboarding,
  updateCommercialLeadPrivacy,
  updateCommercialLeadProofs,
} from '@/lib/api/client/commercial';
import { buildDispatchVariables } from '../lead-transition-helpers';
import { buildSchedulingInviteStatusMessage } from '../scheduling-invite-message';
import { getDispatchStage, toApiError, toApiErrorWithReason, type ComercialErrorAction } from '../model';

interface UseCommercialLeadActionsParams {
  deleteConfirmText: string;
  deleteReason: string;
  fetchLeads: () => Promise<void>;
  pendingDeleteLead: CommercialLead | null;
  refreshSelectedLeadMeta: (leadId: string) => Promise<void>;
  selectedLead: CommercialLead | null;
  setDeleteConfirmText: Dispatch<SetStateAction<string>>;
  setDeleteReason: Dispatch<SetStateAction<string>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setErrorAction: Dispatch<SetStateAction<ComercialErrorAction>>;
  setPendingDeleteLead: Dispatch<SetStateAction<CommercialLead | null>>;
  setSaving: Dispatch<SetStateAction<boolean>>;
  setSelectedLead: Dispatch<SetStateAction<CommercialLead | null>>;
  setStatusMessage: Dispatch<SetStateAction<string | null>>;
}

export function useCommercialLeadActions({
  deleteConfirmText,
  deleteReason,
  fetchLeads,
  pendingDeleteLead,
  refreshSelectedLeadMeta,
  selectedLead,
  setDeleteConfirmText,
  setDeleteReason,
  setError,
  setErrorAction,
  setPendingDeleteLead,
  setSaving,
  setSelectedLead,
  setStatusMessage,
}: UseCommercialLeadActionsParams) {
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
      const result = await dispatchCommercialCommunication({ leadId: lead.leadId, channel, stage, variables: buildDispatchVariables(lead) });
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

  const onSendSchedulingInvite = async (lead: CommercialLead) => {
    try {
      setSaving(true);
      setError(null);
      setErrorAction(null);

      const invite = await sendCommercialSchedulingInvite(lead.leadId, {
        timezone: lead.timezone,
      });

      setStatusMessage(buildSchedulingInviteStatusMessage(invite));
      await fetchLeads();
    } catch (err) {
      const apiError = toApiErrorWithReason(err, 'Falha ao enviar convite de agendamento.');

      if (apiError.reasonCode === 'BRIEFING_REQUIRED') {
        try {
          const form = await getCommercialLeadFormLink(lead.leadId, 'briefing');
          await navigator.clipboard.writeText(form.url);
          setStatusMessage('Briefing obrigatório antes do convite. Link do briefing copiado para envio ao cliente.');
        } catch {
          setStatusMessage('Briefing obrigatório antes do convite. Gere/copie o link do briefing e envie ao cliente.');
        }
        setError('Convite bloqueado: briefing obrigatório antes do agendamento.');
        return;
      }

      if (apiError.reasonCode === 'LEAD_EMAIL_REQUIRED') {
        setErrorAction(null);
        setError('Convite bloqueado: o lead precisa ter e-mail para agendar via Google Calendar.');
        return;
      }

      if (apiError.reasonCode === 'CALENDAR_LINK_NOT_CONFIGURED') {
        setErrorAction({ type: 'configure_calendar', leadId: lead.leadId });
        setError('Convite bloqueado: responsável sem booking link configurado.');
        return;
      }

      setError(apiError.message);
    } finally {
      setSaving(false);
    }
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

  const onRunCalendarSync = async (leadId?: string) => {
    try {
      setSaving(true);
      setError(null);
      setErrorAction(null);
      const result = await runCommercialCalendarSync();
      setStatusMessage(
        `Sync concluído: calendários ${result.checkedCalendars}, eventos ${result.processedEvents}, vínculos ${result.linkedLeads}, fila ${result.queued}.`,
      );
      await fetchLeads();
      if (leadId) {
        await refreshSelectedLeadMeta(leadId);
      }
    } catch (err) {
      setError(toApiError(err, 'Falha ao executar sync do Google Calendar.'));
    } finally {
      setSaving(false);
    }
  };

  return {
    onDeleteLeadPermanently,
    onDispatchByStage,
    onGenerateBriefingLink,
    onRunCalendarSync,
    onSendSchedulingInvite,
    onSubmitBriefing,
    onTriggerFollowup,
    onUpdateOnboarding,
    onUpdatePrivacy,
    onUpdateProofs,
  };
}
