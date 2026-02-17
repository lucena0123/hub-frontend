export type OptimizationTaskStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'completed' | 'failed';

export interface OptimizationTaskInput {
    insightId: string;
    ruleId: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    entityId?: string;
    entityName?: string;
    autoAction?: {
        type: string;
        entityId: string;
        amount?: number;
        reason: string;
    };
}

export interface OptimizationTask {
    id: string;
    taskId: string;
    name: string;
    lane: string;
    status: OptimizationTaskStatus;
    priority: number;
    processInstanceId: string;
    processInstance?: {
        clientId: string;
        processId: string;
    };
    input: OptimizationTaskInput;
    output?: unknown;
    createdAt?: string; // ISO date
    updatedAt?: string;
}

export interface OptimizationRule {
    id: string;
    title: string;
    description: string;
    condition: string;
    level: 'campaign' | 'creative' | 'adset' | 'qualification' | 'data';
    severity: 'critical' | 'warning' | 'info' | 'opportunity';
    category: 'campaign' | 'creative' | 'adset' | 'qualification' | 'data';
    action: 'review' | 'pause' | 'refresh' | 'scale' | 'track' | 'sync';
    enabled?: boolean;
    parameters?: Record<string, unknown>;
    parametersSchema?: Record<string, unknown> | null;
    parametersTemplate?: Record<string, unknown> | null;
    source?: 'system' | 'custom';
    // Backward compatibility for any older payloads.
    name?: string;
}

export type BoardMode = 'workflow' | 'campaign';

export interface BoardColumn {
    id: string;
    title: string;
    tasks: OptimizationTask[];
    type: 'status' | 'campaign';
    metadata?: Record<string, unknown>; // e.g., campaign metrics if in campaign mode
}
