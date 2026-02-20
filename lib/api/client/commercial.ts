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

export type CommercialFormType = 'briefing' | 'onboarding' | 'custom';

export type ContractStatus = 'pendente' | 'assinado';
export type PaymentStatus = 'pendente' | 'pago';

export interface CommercialLead {
  leadId: string;
  dataEntrada: string;
  nomeEscritorio: string;
  origem: string;
  responsavel: string;
  statusAtual: CommercialLeadStatus;
  proximaAcao?: string;
  dataProximaAcao?: string;
  dor01Ok: boolean;
  dor02Ok: boolean;
  dor03Ok: boolean;
  formToken?: string;
  formType?: CommercialFormType;
  formSubmittedAt?: string;
  formPayloadJson?: Record<string, unknown>;
  contractStatus: ContractStatus;
  paymentStatus: PaymentStatus;
  followupD2At?: string;
  followupD5At?: string;
  onboardingD0Ok: boolean;
  onboardingD1Ok: boolean;
  onboardingD2Ok: boolean;
  onboardingD3D4Ok: boolean;
  onboardingD5D7Ok: boolean;
  consentGiven: boolean;
  consentGivenAt?: string;
  retentionUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommercialDashboard {
  total: number;
  novos: number;
  diagnosticos: number;
  propostas: number;
  fechados: number;
}

export interface CommercialSlaAlert {
  leadId: string;
  nomeEscritorio: string;
  statusAtual: CommercialLeadStatus;
  responsavel: string;
  updatedAt: string;
  hoursInStatus: number;
}

export interface CommercialDailySummary {
  date: string;
  novosLeads: number;
  leadsAtrasadosSla24h: number;
  propostasSemFollowup: number;
  negociacoesAbertas: number;
  fechadosHoje: number;
}

export interface CommercialLeadTimelineEvent {
  id: string;
  leadId: string;
  statusOrigem: string;
  statusDestino: string;
  actor?: string;
  observacao?: string;
  createdAt: string;
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

export interface SubmitCommercialFormPayload {
  formType: CommercialFormType;
  payload: Record<string, unknown>;
  submittedAt?: string;
}

export interface UpdateCommercialLeadProofsPayload {
  contractStatus?: ContractStatus;
  paymentStatus?: PaymentStatus;
  observacao?: string;
}

export interface UpdateCommercialLeadOnboardingPayload {
  d0Ok?: boolean;
  d1Ok?: boolean;
  d2Ok?: boolean;
  d3D4Ok?: boolean;
  d5D7Ok?: boolean;
  observacao?: string;
}

export interface UpdateCommercialLeadPrivacyPayload {
  consentGiven?: boolean;
  retentionUntil?: string;
  observacao?: string;
}

export async function getCommercialLeads(params?: {
  status?: CommercialLeadStatus;
  responsavel?: string;
  limit?: number;
  offset?: number;
}): Promise<CommercialLead[]> {
  const { data } = await apiClient.get<CommercialLead[]>('/api/comercial/leads', {
    params,
  });
  return data;
}

export async function getCommercialDashboard(rangeDays?: 7 | 30): Promise<CommercialDashboard> {
  const { data } = await apiClient.get<CommercialDashboard>('/api/comercial/dashboard', {
    params: rangeDays ? { rangeDays } : undefined,
  });
  return data;
}

export async function getCommercialSlaAlerts(params?: { maxAgeHours?: number; limit?: number }): Promise<CommercialSlaAlert[]> {
  const { data } = await apiClient.get<CommercialSlaAlert[]>('/api/comercial/alerts', { params });
  return data;
}

export async function getCommercialDailySummary(): Promise<CommercialDailySummary> {
  const { data } = await apiClient.get<CommercialDailySummary>('/api/comercial/daily-summary');
  return data;
}

export async function getCommercialLeadTimeline(leadId: string, limit = 25): Promise<CommercialLeadTimelineEvent[]> {
  const { data } = await apiClient.get<CommercialLeadTimelineEvent[]>(`/api/comercial/leads/${leadId}/timeline`, {
    params: { limit },
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

export async function submitCommercialForm(leadId: string, payload: SubmitCommercialFormPayload): Promise<CommercialLead> {
  const { data } = await apiClient.post<CommercialLead>(`/api/comercial/leads/${leadId}/forms/submit`, payload);
  return data;
}

export async function updateCommercialLeadProofs(leadId: string, payload: UpdateCommercialLeadProofsPayload): Promise<CommercialLead> {
  const { data } = await apiClient.post<CommercialLead>(`/api/comercial/leads/${leadId}/proofs`, payload);
  return data;
}

export async function updateCommercialLeadOnboarding(leadId: string, payload: UpdateCommercialLeadOnboardingPayload): Promise<CommercialLead> {
  const { data } = await apiClient.post<CommercialLead>(`/api/comercial/leads/${leadId}/onboarding`, payload);
  return data;
}

export async function updateCommercialLeadPrivacy(leadId: string, payload: UpdateCommercialLeadPrivacyPayload): Promise<CommercialLead> {
  const { data } = await apiClient.post<CommercialLead>(`/api/comercial/leads/${leadId}/privacy`, payload);
  return data;
}
