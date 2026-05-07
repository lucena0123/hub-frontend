'use client';

import type { Dispatch, SetStateAction } from 'react';

import {
  CommercialLead,
  CommercialLeadStatus,
  createCommercialLeadAsset,
  updateCommercialLeadRequirements,
} from '@/lib/api/client/commercial';
import { toApiError } from '../model';

interface UseCommercialMetaActionsParams {
  refreshSelectedLeadMeta: (leadId: string) => Promise<void>;
  setError: Dispatch<SetStateAction<string | null>>;
  setSaving: Dispatch<SetStateAction<boolean>>;
  setStatusMessage: Dispatch<SetStateAction<string | null>>;
}

export function useCommercialMetaActions({
  refreshSelectedLeadMeta,
  setError,
  setSaving,
  setStatusMessage,
}: UseCommercialMetaActionsParams) {
  const onUpdateRequirementStatus = async (
    lead: CommercialLead,
    requirementKey: string,
    status: 'pending' | 'done' | 'waived',
  ) => {
    try {
      setSaving(true);
      setError(null);
      await updateCommercialLeadRequirements(lead.leadId, {
        updates: [{ requirementKey, status }],
      });
      setStatusMessage(`Requisito ${requirementKey} atualizado para ${status}.`);
      await refreshSelectedLeadMeta(lead.leadId);
    } catch (err) {
      setError(toApiError(err, 'Falha ao atualizar requisito.'));
    } finally {
      setSaving(false);
    }
  };

  const onAddLeadAsset = async (
    lead: CommercialLead,
    payload: { stage: CommercialLeadStatus; assetType: string; url: string },
  ) => {
    try {
      setSaving(true);
      setError(null);
      await createCommercialLeadAsset(lead.leadId, payload);
      setStatusMessage(`Asset ${payload.assetType} registrado.`);
      await refreshSelectedLeadMeta(lead.leadId);
    } catch (err) {
      setError(toApiError(err, 'Falha ao registrar asset.'));
    } finally {
      setSaving(false);
    }
  };

  return {
    onAddLeadAsset,
    onUpdateRequirementStatus,
  };
}
