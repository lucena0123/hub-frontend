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

export type CommercialAreaPrincipal = 'trabalhista' | 'aereo' | 'salario_maternidade' | 'previdenciario' | 'outro';

export interface CommercialLead {
  leadId: string;
  dataEntrada: string;
  nomeEscritorio: string;
  nomeContato?: string;
  origem: string;
  responsavel: string;
  instagram?: string;
  whatsapp?: string;
  email?: string;
  cidade?: string;
  areaPrincipal?: CommercialAreaPrincipal;
  qtdAdvogados?: number;
  faturamentoEstimado?: number;
  orcamentoMarketing?: number;
  timezone?: string;
  valProposta?: number;
  calEventId?: string;
  dataDiagnostico?: string;
  calEventUrl?: string;
  calMeetUrl?: string;
  calOrganizerEmail?: string;
  calSyncedAt?: string;
  scheduledFrom?: 'quick_suggestion_1' | 'quick_suggestion_2' | 'calendar' | 'google_booking';
  urlProposta?: string;
  scoreQualificacao?: number;
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

export interface CommercialFollowupDue {
  leadId: string;
  nomeEscritorio: string;
  responsavel: string;
  statusAtual: CommercialLeadStatus;
  followupType: 'D+2' | 'D+5';
  dueAt: string;
}

export interface CommercialRetentionAlert {
  leadId: string;
  nomeEscritorio: string;
  responsavel: string;
  retentionUntil: string;
  daysOverdue: number;
}

export interface CommercialFormLink {
  leadId: string;
  formType: CommercialFormType;
  formToken: string;
  url: string;
}

export interface CommercialIntegrationEvent {
  id: string;
  leadId: string;
  channel: string;
  eventType: string;
  externalEventId?: string;
  payload?: Record<string, unknown>;
  occurredAt: string;
  createdAt: string;
}

export interface CommercialDispatchHealthByChannel {
  channel: string;
  total: number;
  success: number;
  failed: number;
  successRate: number;
}

export interface CommercialDispatchHealthSummary {
  windowDays: number;
  total: number;
  success: number;
  failed: number;
  successRate: number;
  byChannel: CommercialDispatchHealthByChannel[];
}

export interface CommercialRequirementStatus {
  requirementId: string;
  requirementKey: string;
  stage: CommercialLeadStatus;
  required: boolean;
  status: 'pending' | 'done' | 'waived';
  source: 'system' | 'manual';
  satisfied: boolean;
  type: 'field' | 'file' | 'event' | 'boolean';
  reason?: string;
  evidence?: Record<string, unknown>;
}

export interface CommercialLeadRequirementsResponse {
  leadId: string;
  stage: CommercialLeadStatus;
  requirements: CommercialRequirementStatus[];
}

export interface CommercialAsset {
  id: string;
  leadId: string;
  stage: CommercialLeadStatus;
  assetType: string;
  storageProvider: string;
  storageRef?: string;
  url: string;
  version: number;
  checksum?: string;
  createdBy?: string;
  createdAt: string;
}

export interface CommercialTemplateSummary {
  id: string;
  channel: 'whatsapp' | 'gmail';
  stage: 'primeiro_contato' | 'diagnostico_agendado' | 'proposta_enviada' | 'negociacao' | 'fechado';
  slug: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  latestVersionId?: string | null;
  latestVersion?: number | null;
  latestStatus?: 'draft' | 'published' | 'archived' | null;
}

export interface CommercialTemplateVersion {
  id: string;
  templateId: string;
  version: number;
  content: Record<string, unknown>;
  status: 'draft' | 'published' | 'archived';
  createdBy?: string;
  createdAt: string;
}

export interface CommercialTemplateWithVersions {
  template: {
    id: string;
    channel: 'whatsapp' | 'gmail';
    stage: 'primeiro_contato' | 'diagnostico_agendado' | 'proposta_enviada' | 'negociacao' | 'fechado';
    slug: string;
    name: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  versions: CommercialTemplateVersion[];
}

export interface CommercialCalendarConfig {
  id: string;
  responsavelKey: string;
  calendarId: string;
  bookingUrl: string;
  ownerEmail: string;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommercialCalendarReconciliationItem {
  id: string;
  calendarConfigId: string;
  googleEventId: string;
  attendeeEmail?: string;
  eventStart?: string;
  eventEnd?: string;
  payload?: Record<string, unknown>;
  reasonCode: string;
  status: 'pending' | 'resolved' | 'ignored';
  leadId?: string;
  resolvedBy?: string;
  resolvedAt?: string;
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
  waiveRequirements?: string[];
  waiveReason?: string;
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

export interface DeleteCommercialLeadPayload {
  confirmText: string;
  reason?: string;
  actor?: string;
}

export interface CommercialScheduleSlot {
  start: string;
  end: string;
  label?: string;
}

export interface CommercialSchedulingSuggestedSlot {
  slotStart: string;
  slotEnd: string;
  label: string;
  quickToken?: string;
  quickLink?: string;
}

export interface CommercialSchedulingChannelError {
  channel: 'whatsapp' | 'gmail';
  message: string;
}

export interface CommercialSchedulingInviteResponse {
  inviteId: string;
  leadId: string;
  calendarUrl: string;
  bookingUrl?: string;
  provider?: 'google_booking' | 'hub_public';
  interactiveMode?: 'buttons_3';
  whatsappMode?: 'buttons_3' | 'text_reply';
  interactiveAttempted?: boolean;
  suggestedSlots: CommercialSchedulingSuggestedSlot[];
  channelsSent: Array<'whatsapp' | 'gmail'>;
  channelErrors?: CommercialSchedulingChannelError[];
  sentAt: string;
  expiresAt: string;
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

export async function getCommercialIntegrationEvents(leadId: string, limit = 25): Promise<CommercialIntegrationEvent[]> {
  const { data } = await apiClient.get<CommercialIntegrationEvent[] | { events?: CommercialIntegrationEvent[] }>(
    `/api/comercial/leads/${leadId}/integrations/events`,
    {
    params: { limit },
    },
  );

  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.events)) return data.events;
  return [];
}

export async function getCommercialLeadRequirements(
  leadId: string,
  stage?: CommercialLeadStatus,
): Promise<CommercialLeadRequirementsResponse> {
  const { data } = await apiClient.get<CommercialLeadRequirementsResponse>(`/api/comercial/leads/${leadId}/requirements`, {
    params: stage ? { stage } : undefined,
  });
  return data;
}

export async function updateCommercialLeadRequirements(
  leadId: string,
  payload: {
    updates: Array<{
      stage?: CommercialLeadStatus;
      requirementKey: string;
      status: 'pending' | 'done' | 'waived';
      evidence?: Record<string, unknown>;
    }>;
  },
): Promise<CommercialLeadRequirementsResponse> {
  const { data } = await apiClient.put<CommercialLeadRequirementsResponse>(`/api/comercial/leads/${leadId}/requirements`, payload);
  return data;
}

export async function getCommercialLeadAssets(
  leadId: string,
  params?: { stage?: CommercialLeadStatus; assetType?: string },
): Promise<CommercialAsset[]> {
  const { data } = await apiClient.get<{ assets?: CommercialAsset[] } | CommercialAsset[]>(
    `/api/comercial/leads/${leadId}/assets`,
    { params },
  );

  if (Array.isArray(data)) return data;
  return data.assets || [];
}

export async function createCommercialLeadAsset(
  leadId: string,
  payload: {
    stage: CommercialLeadStatus;
    assetType: string;
    url: string;
    storageProvider?: string;
    storageRef?: string;
    version?: number;
    checksum?: string;
    createdBy?: string;
  },
): Promise<CommercialAsset> {
  const { data } = await apiClient.post<CommercialAsset>(`/api/comercial/leads/${leadId}/assets`, payload);
  return data;
}

export async function getCommercialDispatchHealth(days = 7): Promise<CommercialDispatchHealthSummary> {
  const { data } = await apiClient.get<CommercialDispatchHealthSummary>('/api/comercial/dispatch/health', {
    params: { days },
  });
  return data;
}

export async function listCommercialTemplates(params?: {
  channel?: 'whatsapp' | 'gmail';
  stage?: 'primeiro_contato' | 'diagnostico_agendado' | 'proposta_enviada' | 'negociacao' | 'fechado';
  isActive?: boolean;
}): Promise<CommercialTemplateSummary[]> {
  const { data } = await apiClient.get<CommercialTemplateSummary[]>('/api/comercial/templates', {
    params: params
      ? {
          ...params,
          isActive: params.isActive === undefined ? undefined : String(params.isActive),
        }
      : undefined,
  });
  return data;
}

export async function createCommercialTemplate(payload: {
  channel: 'whatsapp' | 'gmail';
  stage: 'primeiro_contato' | 'diagnostico_agendado' | 'proposta_enviada' | 'negociacao' | 'fechado';
  slug: string;
  name: string;
  content: Record<string, unknown>;
  status?: 'draft' | 'published' | 'archived';
  profileKey?: string;
  bindAsDefault?: boolean;
}): Promise<CommercialTemplateWithVersions> {
  const { data } = await apiClient.post<CommercialTemplateWithVersions>('/api/comercial/templates', payload);
  return data;
}

export async function updateCommercialTemplate(
  templateId: string,
  payload: {
    name?: string;
    isActive?: boolean;
    content?: Record<string, unknown>;
    status?: 'draft' | 'published' | 'archived';
  },
): Promise<CommercialTemplateWithVersions> {
  const { data } = await apiClient.patch<CommercialTemplateWithVersions>(`/api/comercial/templates/${templateId}`, payload);
  return data;
}

export async function publishCommercialTemplate(
  templateId: string,
  payload?: {
    versionId?: string;
    profileKey?: string;
    channel?: 'whatsapp' | 'gmail';
    stage?: 'primeiro_contato' | 'diagnostico_agendado' | 'proposta_enviada' | 'negociacao' | 'fechado';
  },
): Promise<CommercialTemplateWithVersions> {
  const { data } = await apiClient.post<CommercialTemplateWithVersions>(`/api/comercial/templates/${templateId}/publish`, payload || {});
  return data;
}

export async function listCommercialCalendarConfigs(): Promise<CommercialCalendarConfig[]> {
  const { data } = await apiClient.get<CommercialCalendarConfig[]>('/api/comercial/calendar/configs');
  return data;
}

export async function createCommercialCalendarConfig(payload: {
  responsavelKey: string;
  calendarId: string;
  bookingUrl: string;
  ownerEmail: string;
  timezone?: string;
  isActive?: boolean;
}): Promise<CommercialCalendarConfig> {
  const { data } = await apiClient.post<CommercialCalendarConfig>('/api/comercial/calendar/configs', payload);
  return data;
}

export async function updateCommercialCalendarConfig(
  id: string,
  payload: Partial<{
    responsavelKey: string;
    calendarId: string;
    bookingUrl: string;
    ownerEmail: string;
    timezone: string;
    isActive: boolean;
  }>,
): Promise<CommercialCalendarConfig> {
  const { data } = await apiClient.patch<CommercialCalendarConfig>(`/api/comercial/calendar/configs/${id}`, payload);
  return data;
}

export async function runCommercialCalendarSync(): Promise<{
  checkedCalendars: number;
  processedEvents: number;
  linkedLeads: number;
  queued: number;
}> {
  const { data } = await apiClient.post<{
    checkedCalendars: number;
    processedEvents: number;
    linkedLeads: number;
    queued: number;
  }>('/api/comercial/calendar/sync');
  return data;
}

export async function listCommercialCalendarReconciliation(params?: {
  status?: 'pending' | 'resolved' | 'ignored';
  limit?: number;
}): Promise<CommercialCalendarReconciliationItem[]> {
  const { data } = await apiClient.get<CommercialCalendarReconciliationItem[]>('/api/comercial/calendar/reconciliation', {
    params,
  });
  return data;
}

export async function resolveCommercialCalendarReconciliation(
  id: string,
  payload: {
    status: 'resolved' | 'ignored';
    leadId?: string;
  },
): Promise<CommercialCalendarReconciliationItem> {
  const { data } = await apiClient.post<CommercialCalendarReconciliationItem>(
    `/api/comercial/calendar/reconciliation/${id}/resolve`,
    payload,
  );
  return data;
}

export async function getCommercialFollowupsDue(limit = 20): Promise<CommercialFollowupDue[]> {
  const { data } = await apiClient.get<CommercialFollowupDue[]>('/api/comercial/followups/due', {
    params: { limit },
  });
  return data;
}

export async function triggerCommercialFollowupDispatch(payload: {
  leadId: string;
  followupType: 'D+2' | 'D+5';
  channel?: 'whatsapp' | 'gmail';
}): Promise<{ ok: true; leadId: string; eventId: string }> {
  const { data } = await apiClient.post<{ ok: true; leadId: string; eventId: string }>('/api/comercial/followups/dispatch', payload);
  return data;
}

export async function getCommercialRetentionDue(limit = 20): Promise<CommercialRetentionAlert[]> {
  const { data } = await apiClient.get<CommercialRetentionAlert[]>('/api/comercial/privacy/retention-due', {
    params: { limit },
  });
  return data;
}

export async function createCommercialLead(input: {
  origem: 'instagram' | 'indicacao' | 'site' | 'whatsapp' | 'outro';
  nomeEscritorio: string;
  responsavel: string;
  nomeContato?: string;
  whatsapp?: string;
  email?: string;
  instagram?: string;
  cidade?: string;
  areaPrincipal?: CommercialAreaPrincipal;
  qtdAdvogados?: number;
  faturamentoEstimado?: number;
  orcamentoMarketing?: number;
  timezone?: string;
  proximaAcao?: string;
  dataProximaAcao?: string;
}): Promise<CommercialLead> {
  const { data } = await apiClient.post<CommercialLead>('/api/comercial/leads', input);
  return data;
}

export async function updateCommercialLead(
  leadId: string,
  input: Partial<{
    nomeContato: string;
    email: string;
    whatsapp: string;
    instagram: string;
    cidade: string;
    areaPrincipal: CommercialAreaPrincipal;
    timezone: string;
    qtdAdvogados: number;
    valProposta: number;
    urlProposta: string;
    faturamentoEstimado: number;
    orcamentoMarketing: number;
    scoreQualificacao: number;
    proximaAcao: string;
    dataProximaAcao: string;
  }>,
): Promise<CommercialLead> {
  const { data } = await apiClient.patch<CommercialLead>(`/api/comercial/leads/${leadId}`, input);
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

export async function deleteCommercialLead(leadId: string, payload: DeleteCommercialLeadPayload): Promise<{ ok: true; leadId: string }> {
  const { data } = await apiClient.post<{ ok: true; leadId: string }>(`/api/comercial/leads/${leadId}/delete`, payload);
  return data;
}

export async function getCommercialSchedulingSlots(payload: {
  leadId: string;
  date?: string;
  durationMin?: number;
  timezone?: string;
}): Promise<{ leadId: string; slots: CommercialScheduleSlot[] }> {
  const { data } = await apiClient.post<{ leadId: string; slots: CommercialScheduleSlot[] }>(
    '/api/comercial/scheduling/slots',
    payload,
  );
  return data;
}

export async function confirmCommercialScheduling(payload: {
  leadId: string;
  slotStart: string;
  slotEnd: string;
  attendeeName?: string;
  attendeeEmail?: string;
  timezone?: string;
}): Promise<{ ok: true; leadId: string; eventId?: string }> {
  const { data } = await apiClient.post<{ ok: true; leadId: string; eventId?: string }>(
    '/api/comercial/scheduling/confirm',
    payload,
  );
  return data;
}

export async function sendCommercialSchedulingInvite(
  leadId: string,
  payload?: {
    daysWindow?: number;
    durationMin?: number;
    timezone?: string;
  },
): Promise<CommercialSchedulingInviteResponse> {
  const { data } = await apiClient.post<CommercialSchedulingInviteResponse>(
    `/api/comercial/leads/${leadId}/scheduling/invite`,
    payload || {},
  );
  return data;
}

export async function getCommercialLeadFormLink(leadId: string, formType: CommercialFormType = 'briefing'): Promise<CommercialFormLink> {
  const { data } = await apiClient.get<CommercialFormLink>(`/api/comercial/leads/${leadId}/forms/link`, {
    params: { formType },
  });
  return data;
}

export type CommercialDispatchChannel = 'whatsapp' | 'gmail';

export type CommercialDispatchStage =
  | 'primeiro_contato'
  | 'diagnostico_agendado'
  | 'proposta_enviada'
  | 'negociacao'
  | 'fechado';

export interface DispatchCommercialCommunicationInput {
  leadId: string;
  channel: CommercialDispatchChannel;
  stage: CommercialDispatchStage;
  templateKey?: string;
  recipient?: string;
  variables?: Record<string, unknown>;
}

export interface DispatchCommercialCommunicationResponse {
  ok: true;
  leadId: string;
  channel: CommercialDispatchChannel;
  stage: CommercialDispatchStage;
  eventId: string;
}

export const dispatchCommercialCommunication = async (
  input: DispatchCommercialCommunicationInput,
): Promise<DispatchCommercialCommunicationResponse> => {
  const { data } = await apiClient.post<DispatchCommercialCommunicationResponse>('/api/comercial/dispatch', input);
  return data;
};
