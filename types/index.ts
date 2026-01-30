/**
 * BPMN System - Frontend Types
 */

export interface Client {
  id: string;
  name: string;
  email: string;
  cpfCnpj?: string;
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
  createdAt?: string;
  updatedAt?: string;
  clientName?: string;
  clientTier?: string;
}

export interface Task {
  id: string;
  processInstanceId: string;
  taskName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedTo?: string;
  priority: number;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  output?: Record<string, unknown>;
  error?: string;
  createdAt: string;
  updatedAt: string;
  processId?: string;
  clientName?: string;
}

export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  runningProcesses: number;
  pendingTasks: number;
  completedTasksToday: number;
  timestamp: string;
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
