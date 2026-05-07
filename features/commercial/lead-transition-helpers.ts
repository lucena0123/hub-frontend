import type { CommercialLead, CommercialLeadStatus } from '@/lib/api/client/commercial';
import type { ComercialErrorAction, PendingTransition } from './model';

export type MoveLeadOptions = {
  motivoNutricao?: string;
  motivoPerda?: string;
  dataProximaAcao?: string;
  observacao?: string;
};

export function buildMoveLeadPayload(to: CommercialLeadStatus, options?: MoveLeadOptions) {
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
  return payload;
}

export function resolveMoveLeadErrorAction(params: {
  leadId: string;
  reasonCode?: string | null;
  to: CommercialLeadStatus;
}): ComercialErrorAction {
  const { leadId, reasonCode, to } = params;
  if (to === 'diagnostico_agendado' && reasonCode === 'MISSING_CALENDAR_EVENT') {
    return { type: 'send_scheduling_invite', leadId };
  }
  if (to === 'diagnostico_agendado' && reasonCode === 'MISSING_MEET_LINK') {
    return { type: 'run_calendar_sync', leadId };
  }
  return null;
}

export function buildSpecialTransitionOptions(
  pendingTransition: PendingTransition,
  transitionReason: string,
  transitionDate: string,
): MoveLeadOptions {
  return {
    motivoNutricao: pendingTransition.to === 'nutricao' ? transitionReason : undefined,
    motivoPerda: pendingTransition.to === 'perdido' ? transitionReason : undefined,
    dataProximaAcao: pendingTransition.to === 'nutricao' ? new Date(`${transitionDate}T09:00:00`).toISOString() : undefined,
  };
}

export function buildDispatchVariables(lead: CommercialLead) {
  return {
    nomeEscritorio: lead.nomeEscritorio,
    responsavel: lead.responsavel,
    statusAtual: lead.statusAtual,
  };
}
