import { apiClient } from './http';

export type CommercialLeadStatus =
  | 'novo_lead'
  | 'primeiro_contato'
  | 'diagnostico_agendado'
  | 'diagnostico_concluido'
  | 'proposta_enviada'
  | 'negociacao'
  | 'fechado'
  | 'nutricao'
  | 'perdido';

export interface CommercialLead {
  leadId: string;
  nomeEscritorio: string;
  origem: string;
  responsavel: string;
  statusAtual: CommercialLeadStatus;
  proximaAcao?: string;
  dataProximaAcao?: string;
  dor01Ok: boolean;
  dor02Ok: boolean;
  dor03Ok: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MoveLeadPayload {
  to: CommercialLeadStatus;
  observacao?: string;
  actor?: string;
  dor01Ok?: boolean;
  dor02Ok?: boolean;
  dor03Ok?: boolean;
  motivoNutricao?: string;
  motivoPerda?: string;
  dataProximaAcao?: string;
}

export async function getCommercialLeads(status?: CommercialLeadStatus): Promise<CommercialLead[]> {
  const { data } = await apiClient.get<CommercialLead[]>('/api/comercial/leads', {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function createCommercialLead(input: {
  origem: 'instagram' | 'indicacao' | 'site' | 'whatsapp' | 'outro';
  nomeEscritorio: string;
  responsavel: string;
}): Promise<CommercialLead> {
  const { data } = await apiClient.post<CommercialLead>('/api/comercial/leads', input);
  return data;
}

export async function moveCommercialLead(leadId: string, payload: MoveLeadPayload): Promise<CommercialLead> {
  const { data } = await apiClient.post<CommercialLead>(`/api/comercial/leads/${leadId}/move`, payload);
  return data;
}
