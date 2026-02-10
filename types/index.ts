/**
 * BPMN System - Frontend Types
 */

export interface Client {
  id: string;
  name: string;
  email: string;
  cpfCnpj?: string;
  metaAdAccountId?: string | null;
  tier: 'basic' | 'premium' | 'enterprise' | 'standard';
  status: 'active' | 'inactive' | 'pending' | 'suspended' | 'churned';
  budget: number;
  contractStart: string;
  contractEnd?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  clientId: string;
  name: string;
  budget: number;
  status: 'planning' | 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  startDate?: string;
  endDate?: string;
  platform?: 'meta' | 'google' | 'linkedin' | 'tiktok' | 'other';
  externalId?: string;
  objective?: string;
  optimizationThemeKey?: string | null;
  optimizationSubthemeKey?: string | null;
  targetAudience?: string;
  spent?: number;
  createdAt?: string;
  updatedAt?: string;
  clientName?: string;
  clientTier?: string;
}

export interface ProcessInstance {
  id: string;
  processId: string;
  clientId: string;
  clientName?: string;
  campaignId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'suspended' | 'paused';
  priority: number;
  startedAt: string;
  completedAt?: string;
  currentStep?: string;
  currentPhase?: string;
  currentTask?: string;
  progress?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}



export interface OptimizationActionPayload {
  type: 'pause_ad' | 'resume_ad' | 'set_adset_budget' | 'set_campaign_budget';
  entityId: string;
  amount?: number;
  reason: string;
}

export interface Task {
  id: string;
  taskId: string; // Business ID (e.g., opt_123)
  processInstanceId: string;
  name: string; // Was taskName, backend sends 'name'
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'suspended';
  lane?: string;
  priority: number;
  input?: {
    uniqueKey?: string;
    insightId?: string;
    description?: string;
    severity?: string;
    entityName?: string;
    autoAction?: OptimizationActionPayload;
    [key: string]: unknown;
  };
  startedAt: string;
  completedAt?: string;
  processInstance?: {
    processId: string;
    client?: {
      name: string;
      id?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  clientName?: string;
}

export interface DashboardOverview {
  clients: {
    total: number;
    active: number;
    byTier: Record<string, number>;
  };
  campaigns: {
    total: number;
    active: number;
    byPlatform: Record<string, number>;
  };
  performance: {
    totalSpend: number;
    totalRevenue: number;
    totalConversions: number;
    totalLeads: number;
    avgRoas: number;
    avgCtr: number;
    avgCpl: number;
  };
  bpmn: {
    clientsInExecution: number;
    clientsInMonitoring: number;
    avgProgress: number;
    blockedClients: number;
  };
  reports: {
    totalGenerated: number;
    lastGenerated: string | null;
  };
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  runningProcesses: number;
  pendingTasks: number;
  completedTasksToday: number;
  timestamp: string;
}

export interface PerformanceAlert {
  id: string;
  clientId: string;
  clientName: string;
  campaignId?: string;
  campaignName?: string;
  type: 'warning' | 'critical' | 'info';
  category: string;
  message: string;
  metric: string;
  currentValue: number;
  threshold: number;
  createdAt: string;
}

export interface AlertsResponse {
  total: number;
  critical: number;
  warning: number;
  alerts: PerformanceAlert[];
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
  };
  environment: string;
  version: string;
  error?: string;
}

export * from './metrics';
