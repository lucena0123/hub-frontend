import type {
  CommercialFollowupDue,
  CommercialLead,
  CommercialLeadStatus,
  CommercialRetentionAlert,
  CommercialSlaAlert,
} from '@/lib/api/client/commercial';
import { COLUMNS } from '../constants';
import type { CommercialLeadFilters } from './types';
import { hasOperationalInconsistency, isLeadBlocked } from './lead-rules';

export const filterCommercialLeads = (
  leads: CommercialLead[],
  filters: CommercialLeadFilters,
) => {
  let base = leads.filter((lead) => {
    if (filters.statusFilter !== 'all' && lead.statusAtual !== filters.statusFilter) return false;
    if (filters.origemFilter !== 'all' && lead.origem !== filters.origemFilter) return false;
    if (filters.responsavelFilter !== 'all' && lead.responsavel !== filters.responsavelFilter) return false;
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      if (!`${lead.nomeEscritorio} ${lead.origem} ${lead.responsavel}`.toLowerCase().includes(q)) return false;
    }
    if (filters.blockedOnly && !isLeadBlocked(lead)) return false;
    if (filters.inconsistentOnly && !hasOperationalInconsistency(lead)) return false;
    return true;
  });
  if (filters.sortBy === 'name_asc') {
    base = [...base].sort((a, b) => a.nomeEscritorio.localeCompare(b.nomeEscritorio, 'pt-BR'));
  }
  return base;
};

export const groupLeadsByStatus = (leads: CommercialLead[]) => {
  const grouped: Record<string, CommercialLead[]> = {};
  for (const col of COLUMNS) grouped[col.key] = [];
  for (const lead of leads) grouped[lead.statusAtual]?.push(lead);
  return grouped;
};

export const buildExecutiveFunnel = (
  filteredLeads: CommercialLead[],
  leadsByStatus: Record<string, CommercialLead[]>,
) => {
  const total = Math.max(filteredLeads.length, 1);
  const count = (status: CommercialLeadStatus) => (leadsByStatus[status] || []).length;
  const diagnostico = count('diagnostico_agendado') + count('diagnostico_concluido');
  const proposta = count('proposta_enviada');
  const fechado = count('fechado');
  return {
    primeiroContato: count('primeiro_contato'),
    diagnostico,
    proposta,
    negociacao: count('negociacao'),
    fechado,
    taxaFechamento: +((fechado / total) * 100).toFixed(1),
    taxaDiagToProposta: diagnostico > 0 ? +((proposta / diagnostico) * 100).toFixed(1) : 0,
    taxaPropostaToFechado: proposta > 0 ? +((fechado / proposta) * 100).toFixed(1) : 0,
  };
};

export const buildOperationalBottlenecks = (
  filteredLeads: CommercialLead[],
  slaAlerts: CommercialSlaAlert[],
) => ({
  blocked: filteredLeads.filter(isLeadBlocked).length,
  inconsistent: filteredLeads.filter(hasOperationalInconsistency).length,
  slaCritical: slaAlerts.filter((alert) => alert.hoursInStatus >= 48).length,
  slaWarning: slaAlerts.filter((alert) => alert.hoursInStatus >= 24 && alert.hoursInStatus < 48).length,
});

export const buildCriticalPendencies = (
  slaAlerts: CommercialSlaAlert[],
  followupsDue: CommercialFollowupDue[],
  retentionDue: CommercialRetentionAlert[],
) => {
  const byLead = new Map<string, { leadId: string; nomeEscritorio: string; reason: string; severity: number }>();
  slaAlerts.forEach((alert) => byLead.set(alert.leadId, {
    leadId: alert.leadId,
    nomeEscritorio: alert.nomeEscritorio,
    reason: `SLA ${alert.hoursInStatus}h em ${alert.statusAtual}`,
    severity: alert.hoursInStatus >= 48 ? 3 : 2,
  }));
  followupsDue.forEach((followup) => {
    const prev = byLead.get(followup.leadId);
    const next = {
      leadId: followup.leadId,
      nomeEscritorio: followup.nomeEscritorio,
      reason: `Follow-up vencido (${followup.followupType})`,
      severity: 2,
    };
    if (!prev || next.severity >= prev.severity) byLead.set(followup.leadId, next);
  });
  retentionDue.forEach((retention) => {
    const prev = byLead.get(retention.leadId);
    const next = {
      leadId: retention.leadId,
      nomeEscritorio: retention.nomeEscritorio,
      reason: `Retenção vencida há ${retention.daysOverdue} dia(s)`,
      severity: 2,
    };
    if (!prev || next.severity >= prev.severity) byLead.set(retention.leadId, next);
  });
  return Array.from(byLead.values())
    .sort((a, b) => b.severity - a.severity || a.nomeEscritorio.localeCompare(b.nomeEscritorio, 'pt-BR'))
    .slice(0, 8);
};
