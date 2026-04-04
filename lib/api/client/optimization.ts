import { apiClient } from './http';

export type AnomalyType =
    | 'anomaly_cpl_spike'
    | 'anomaly_conversations_drop'
    | 'anomaly_overspend'
    | 'anomaly_ctr_drop';

export type AnomalyDetection = {
    id: string;
    clientId: string;
    clientName?: string;
    campaignId: string;
    campaignName: string;
    anomalyType: AnomalyType;
    severity: 'warning' | 'critical';
    metricCurrent: number;
    metricBaseline: number;
    changePct: number;
    description: string;
    acknowledged: boolean;
    createdAt: string;
};

export type HealthFactor = {
    name: string;
    score: number;
    weight: number;
    weighted: number;
    detail: string;
};

export type CampaignHealthResult = {
    campaignId: string;
    campaignName: string;
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    factors: HealthFactor[];
    recommendation: string;
};

export type CampaignHealthResponse = {
    clientId: string;
    overallScore: number | null;
    total: number;
    campaigns: CampaignHealthResult[];
};

export type AutoApprovalRuleConfig = {
    enabled: boolean;
    minSpend?: number;
    maxSpend?: number;
    maxConversations?: number;
    minFrequency?: number;
    ctrDropPct?: number;
    cplMultiplier?: number;
    minConversations?: number;
    maxIncreasePct?: number;
    pacingThreshold?: number;
    reductionPct?: number;
    [key: string]: unknown;
};

export type AutoApprovalConfig = {
    autoApproveEnabled: boolean;
    autoApproveMaxPerRun: number;
    autoApproveRules: Record<string, AutoApprovalRuleConfig>;
};

type AnomaliesResponse = {
    clientId: string;
    total: number;
    anomalies: AnomalyDetection[];
};

export const getAnomalies = async (clientId: string): Promise<AnomalyDetection[]> => {
    const { data } = await apiClient.get<AnomaliesResponse | AnomalyDetection[]>(
        `/api/clients/${clientId}/optimization/anomalies`
    );
    if (Array.isArray(data)) return data;
    return data.anomalies ?? [];
};

export const getGlobalAnomalies = async (limit: number = 20): Promise<AnomalyDetection[]> => {
    const { data } = await apiClient.get<AnomalyDetection[]>(`/api/metrics/anomalies/critical?limit=${limit}`);
    return data;
};

export const getCampaignHealth = async (clientId: string): Promise<CampaignHealthResult[]> => {
    const { data } = await apiClient.get<CampaignHealthResponse>(`/api/clients/${clientId}/campaign-health`);
    return data.campaigns ?? [];
};

export type OptimizationAuditEvent = {
    id: string;
    action: string;
    eventType: string;
    clientId: string;
    processId?: string | null;
    userId: string;
    userRole: string;
    resource: Record<string, unknown>;
    changes?: Record<string, unknown> | null;
    metadata: Record<string, unknown>;
    timestamp: string;
};

export type OptimizationAuditResponse = {
    success: boolean;
    total: number;
    events: OptimizationAuditEvent[];
};

export type OptimizationAuditSummary = {
    success: boolean;
    actions: Array<{ action: string; total: number }>;
    eventTypes: Array<{ eventType: string; total: number }>;
};

type AutoApprovalConfigResponse = AutoApprovalConfig & { clientId: string };

export const getAutoApprovalConfig = async (clientId: string): Promise<AutoApprovalConfig> => {
    const { data } = await apiClient.get<AutoApprovalConfigResponse>(`/api/clients/${clientId}/automation/config`);
    const { clientId: responseClientId, ...config } = data;
    void responseClientId;
    return config;
};

export const updateAutoApprovalConfig = async (
    clientId: string,
    config: Partial<AutoApprovalConfig>
): Promise<AutoApprovalConfig> => {
    const { data } = await apiClient.put<AutoApprovalConfigResponse>(`/api/clients/${clientId}/automation/config`, config);
    const { clientId: responseClientId, ...updated } = data;
    void responseClientId;
    return updated;
};

export const getOptimizationAudit = async (params?: {
    clientId?: string;
    action?: 'create' | 'update' | 'delete' | 'read';
    eventType?: string;
    sinceHours?: number;
    limit?: number;
}): Promise<OptimizationAuditEvent[]> => {
    const { data } = await apiClient.get<OptimizationAuditResponse>('/api/optimization/audit', { params });
    return data.events ?? [];
};

export const getOptimizationAuditSummary = async (params?: { clientId?: string; sinceHours?: number }): Promise<OptimizationAuditSummary> => {
    const { data } = await apiClient.get<OptimizationAuditSummary>('/api/optimization/audit/summary', { params });
    return data;
};

export type RuleProfileTemplate = {
    id: string;
    name: string;
    nicheKey: string;
    objectiveKey: 'messages' | 'lead' | 'conversion' | 'traffic' | 'awareness';
    channelKey: string;
    isActive: boolean;
    targets: Record<string, unknown> | null;
    copyPolicy: Record<string, unknown> | null;
    version: number;
    createdAt: string;
    updatedAt: string;
};

export type ClientRuleBinding = {
    id: string;
    clientId: string;
    ruleProfileId: string;
    isDefault: boolean;
    priority: number;
    overrideTargets: Record<string, unknown> | null;
    overrideCopyPolicy: Record<string, unknown> | null;
    ruleProfile: RuleProfileTemplate;
    createdAt: string;
    updatedAt: string;
};

export type RuleClassificationReview = {
    id: string;
    entityType: 'client' | 'campaign';
    entityId: string;
    reasonCode: string;
    suggestedProfileId: string | null;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    resolvedAt: string | null;
    resolvedBy: string | null;
    suggestedProfile?: RuleProfileTemplate | null;
};

export const listRuleProfiles = async (params?: {
    nicheKey?: string;
    objectiveKey?: string;
    channelKey?: string;
    isActive?: boolean;
}): Promise<RuleProfileTemplate[]> => {
    const { data } = await apiClient.get<RuleProfileTemplate[]>('/api/rule-profiles', { params });
    return data;
};

export const createRuleProfile = async (payload: {
    name: string;
    nicheKey: string;
    objectiveKey: string;
    channelKey: string;
    isActive?: boolean;
    targets?: Record<string, unknown> | null;
    copyPolicy?: Record<string, unknown> | null;
    version?: number;
}): Promise<RuleProfileTemplate> => {
    const { data } = await apiClient.post<RuleProfileTemplate>('/api/rule-profiles', payload);
    return data;
};

export const updateRuleProfile = async (
    id: string,
    payload: Partial<{
        name: string;
        nicheKey: string;
        objectiveKey: string;
        channelKey: string;
        isActive: boolean;
        targets: Record<string, unknown> | null;
        copyPolicy: Record<string, unknown> | null;
        version: number;
    }>
): Promise<RuleProfileTemplate> => {
    const { data } = await apiClient.patch<RuleProfileTemplate>(`/api/rule-profiles/${id}`, payload);
    return data;
};

export const getClientRuleBindings = async (clientId: string): Promise<ClientRuleBinding[]> => {
    const { data } = await apiClient.get<ClientRuleBinding[]>(`/api/clients/${clientId}/rule-bindings`);
    return data;
};

export const updateClientRuleBindings = async (
    clientId: string,
    payload: {
        bindings: Array<{
            ruleProfileId: string;
            isDefault?: boolean;
            priority?: number;
            overrideTargets?: Record<string, unknown> | null;
            overrideCopyPolicy?: Record<string, unknown> | null;
        }>;
    }
): Promise<ClientRuleBinding[]> => {
    const { data } = await apiClient.put<ClientRuleBinding[]>(`/api/clients/${clientId}/rule-bindings`, payload);
    return data;
};

export const runRuleBackfill = async (): Promise<{ clientsUpdated: number; campaignsUpdated: number; reviewItems: number }> => {
    const { data } = await apiClient.post<{ clientsUpdated: number; campaignsUpdated: number; reviewItems: number }>(
        '/api/rules/backfill'
    );
    return data;
};

export const listRuleReviewQueue = async (params?: {
    status?: 'pending' | 'approved' | 'rejected';
    entityType?: 'client' | 'campaign';
    limit?: number;
}): Promise<RuleClassificationReview[]> => {
    const { data } = await apiClient.get<RuleClassificationReview[]>('/api/rules/review-queue', { params });
    return data;
};

export const resolveRuleReviewItem = async (
    id: string,
    payload: {
        status: 'approved' | 'rejected';
        selectedProfileId?: string | null;
        applyToEntity?: boolean;
    }
): Promise<RuleClassificationReview> => {
    const { data } = await apiClient.post<RuleClassificationReview>(`/api/rules/review-queue/${id}/resolve`, payload);
    return data;
};
