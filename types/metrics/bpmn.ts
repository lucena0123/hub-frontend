export interface BPMNProgress {
  id: string;
  clientId: string;
  currentSubprocess: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  progressPercentage: number;
  completedTasks: string[];
  pendingTasks: string[];
  blockedTasks: string[];
  startedAt?: string;
  estimatedCompletion?: string;
  completedAt?: string;
  notes?: string;
  blockers?: Array<{
    id: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    createdAt: string;
  }>;
  subprocessHistory?: Array<{
    subprocess: string;
    startedAt: string;
    completedAt: string;
    duration: number;
  }>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

