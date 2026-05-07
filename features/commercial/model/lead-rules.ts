import type { CommercialLead, CommercialLeadStatus } from '@/lib/api/client/commercial';

export const getResponsavelOptions = (leads: CommercialLead[]) =>
  Array.from(new Set(leads.map((lead) => lead.responsavel).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

export const isLeadBlocked = (lead: CommercialLead): boolean => {
  if (lead.statusAtual === 'diagnostico_concluido') return lead.formType !== 'briefing' || !lead.consentGiven;
  if (lead.statusAtual === 'negociacao') return lead.contractStatus !== 'assinado' || lead.paymentStatus !== 'pago';
  return false;
};

export const hasOperationalInconsistency = (lead: CommercialLead): boolean => {
  if (['proposta_enviada', 'negociacao', 'fechado'].includes(lead.statusAtual) && !lead.consentGiven) return true;
  if (lead.statusAtual === 'fechado' && (lead.contractStatus !== 'assinado' || lead.paymentStatus !== 'pago')) return true;
  return false;
};

export const getAdvanceGuard = (
  lead: CommercialLead,
  targetStatus: CommercialLeadStatus,
  canManageSensitive: boolean,
): { ok: boolean; reason?: string } => {
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
