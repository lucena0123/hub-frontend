import type { CommercialLeadStatus } from '@/lib/api/client/commercial';

export const COLUMNS: Array<{ key: CommercialLeadStatus; label: string }> = [
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

export const NEXT_STATUS: Partial<Record<CommercialLeadStatus, CommercialLeadStatus>> = {
  novo_lead: 'primeiro_contato',
  primeiro_contato: 'diagnostico_agendado',
  diagnostico_agendado: 'diagnostico_concluido',
  diagnostico_concluido: 'proposta_enviada',
  proposta_enviada: 'negociacao',
  negociacao: 'fechado',
};

export const NURTURE_REASONS = [
  'Sem urgência no momento',
  'Aguardando decisão interna',
  'Aguardando retorno do sócio',
  'Momento financeiro inadequado',
  'Contato sem resposta temporária',
] as const;

export const LOSS_REASONS = [
  'Sem orçamento',
  'Fechou com concorrente',
  'Sem fit de perfil',
  'Sem retorno após follow-up',
  'Projeto adiado/cancelado',
] as const;

export const PAGE_SIZE = 50;

export const getDispatchStage = (
  status: CommercialLeadStatus,
): 'primeiro_contato' | 'diagnostico_agendado' | 'proposta_enviada' | 'negociacao' | 'fechado' | null => {
  if (status === 'novo_lead' || status === 'primeiro_contato') return 'primeiro_contato';
  if (status === 'diagnostico_agendado' || status === 'diagnostico_concluido') return 'diagnostico_agendado';
  if (status === 'proposta_enviada') return 'proposta_enviada';
  if (status === 'negociacao') return 'negociacao';
  if (status === 'fechado') return 'fechado';
  return null;
};
