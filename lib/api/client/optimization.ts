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
