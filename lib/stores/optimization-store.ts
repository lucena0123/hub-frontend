import { create } from 'zustand';
import { OptimizationTask, BoardMode, BoardColumn, OptimizationRule, OptimizationTaskStatus } from '@/types/optimization';
import { Campaign } from '@/types';
import { apiClient } from '@/lib/api/client/http';
import { getApiErrorMessage } from '@/lib/api/client/error';
import { getCampaigns } from '@/lib/api/client/campaigns';

interface OptimizationState {
    tasks: OptimizationTask[];
    campaigns: Campaign[];
    rules: OptimizationRule[]; // Store rules
    isLoading: boolean;
    error: string | null;
    mode: BoardMode;
    columns: BoardColumn[];
    selectedClientId: string | null; // Track selected client

    // Actions
    fetchTasks: (clientId?: string) => Promise<void>;
    fetchRules: (clientId?: string) => Promise<void>; // Updated signature
    createRule: (payload: {
        id: string;
        title: string;
        description: string;
        condition: string;
        level: OptimizationRule['level'];
        severity: OptimizationRule['severity'];
        category: OptimizationRule['category'];
        action: OptimizationRule['action'];
        parametersSchema?: Record<string, unknown> | null;
        parametersTemplate?: Record<string, unknown> | null;
    }, clientId?: string) => Promise<void>;
    updateRuleMeta: (ruleId: string, payload: {
        title?: string;
        description?: string;
        condition?: string;
        level?: OptimizationRule['level'];
        severity?: OptimizationRule['severity'];
        category?: OptimizationRule['category'];
        action?: OptimizationRule['action'];
        parametersSchema?: Record<string, unknown> | null;
        parametersTemplate?: Record<string, unknown> | null;
    }, clientId?: string) => Promise<void>;
    deleteRule: (ruleId: string, clientId?: string) => Promise<void>;
    toggleRule: (ruleId: string, enabled: boolean, clientId: string) => Promise<void>;
    updateRuleConfig: (ruleId: string, parameters: Record<string, unknown>, clientId: string) => Promise<void>;
    moveTask: (taskId: string, newStatus: OptimizationTaskStatus) => Promise<void>;
    setMode: (mode: BoardMode) => void;
    runRule: (ruleId: string, entityId: string, clientId: string) => Promise<void>;
}

export const useOptimizationStore = create<OptimizationState>((set, get) => ({
    tasks: [],
    campaigns: [],
    rules: [],
    isLoading: false,
    error: null,
    mode: 'workflow',
    columns: [],
    selectedClientId: null,

    fetchRules: async (clientId?: string) => {
        try {
            // Pass clientId if available to fetch specific configs
            const params: Record<string, string> = {};
            if (clientId) params.clientId = clientId;

            const response = await apiClient.get<OptimizationRule[]>('/api/optimization/rules', { params });
            set({ rules: response.data });
        } catch (error) {
            console.error('Failed to fetch rules', error);
        }
    },

    createRule: async (payload, clientId) => {
        try {
            await apiClient.post('/api/optimization/rules', payload);
            await get().fetchRules(clientId ?? get().selectedClientId ?? undefined);
        } catch (error) {
            const msg = getApiErrorMessage(error, 'Failed to create rule');
            set({ error: msg });
            throw error;
        }
    },

    updateRuleMeta: async (ruleId, payload, clientId) => {
        try {
            await apiClient.patch(`/api/optimization/rules/${ruleId}`, payload);
            await get().fetchRules(clientId ?? get().selectedClientId ?? undefined);
        } catch (error) {
            const msg = getApiErrorMessage(error, 'Failed to update rule');
            set({ error: msg });
            throw error;
        }
    },

    deleteRule: async (ruleId, clientId) => {
        try {
            await apiClient.delete(`/api/optimization/rules/${ruleId}`);
            await get().fetchRules(clientId ?? get().selectedClientId ?? undefined);
        } catch (error) {
            const msg = getApiErrorMessage(error, 'Failed to delete rule');
            set({ error: msg });
            throw error;
        }
    },

    toggleRule: async (ruleId: string, enabled: boolean, clientId: string) => {
        try {
            // Optimistic update
            set(state => ({
                rules: state.rules.map(r => r.id === ruleId ? { ...r, enabled } : r)
            }));

            await apiClient.post(`/api/optimization/rules/${ruleId}/toggle`, { clientId, enabled });
        } catch (error) {
            console.error('Failed to toggle rule', error);
        }
    },

    updateRuleConfig: async (ruleId: string, parameters: Record<string, unknown>, clientId: string) => {
        try {
            // Optimistic update
            set(state => ({
                rules: state.rules.map(r => r.id === ruleId ? { ...r, parameters } : r)
            }));

            await apiClient.post(`/api/optimization/rules/${ruleId}/config`, { clientId, parameters });
        } catch (error) {
            console.error('Failed to update rule config', error);
            await get().fetchRules(clientId);
            throw error;
        }
    },

    fetchTasks: async (clientId?: string) => {
        set({ isLoading: true, error: null, selectedClientId: clientId || null });
        try {
            const params: Record<string, string> = {};
            if (clientId) params.clientId = clientId;

            // Fetch tasks, campaigns, and RULES in parallel
            const [tasksResponse, campaigns] = await Promise.all([
                apiClient.get<OptimizationTask[]>('/api/optimization/tasks', { params }),
                getCampaigns(clientId ? { clientId, status: 'active' } : { status: 'active' }),
            ]);

            // Fetch rules separately or in parallel if we want, but better to trigger it here
            get().fetchRules(clientId);

            const tasks = tasksResponse.data;

            set({ tasks, campaigns });
            get().setMode(get().mode); // Re-organize columns with new data
        } catch (error) {
            const msg = getApiErrorMessage(error, 'Failed to fetch data');
            set({ error: msg });
        } finally {
            set({ isLoading: false });
        }
    },

    setMode: (mode: BoardMode) => {
        const { tasks, campaigns } = get();
        let columns: BoardColumn[] = [];

        if (mode === 'workflow') {
            // Workflow Mode
            columns = [
                { id: 'pending', title: '🔍 Diagnósticos', type: 'status', tasks: tasks.filter(t => t.status === 'pending') },
                { id: 'in_progress', title: '⏳ Em execução', type: 'status', tasks: tasks.filter(t => t.status === 'in_progress') },
                { id: 'approved', title: '🚀 Aprovados', type: 'status', tasks: tasks.filter(t => t.status === 'approved') },
                { id: 'completed', title: '✅ Concluídos', type: 'status', tasks: tasks.filter(t => t.status === 'completed') },
                { id: 'failed', title: '⚠️ Falharam', type: 'status', tasks: tasks.filter(t => t.status === 'failed') },
                { id: 'rejected', title: '🗑️ Ignorados', type: 'status', tasks: tasks.filter(t => t.status === 'rejected') },
            ];
        } else {
            // Campaign Mode

            // 1. Create columns for ALL active campaigns
            const campaignColumns: BoardColumn[] = campaigns.map(campaign => ({
                id: campaign.id,
                title: `📦 ${campaign.name}`,
                type: 'campaign',
                tasks: [],
                metadata: { budget: campaign.budget, spent: campaign.spent }
            }));

            // 2. "General" column
            const generalColumn: BoardColumn = {
                id: 'general',
                title: '📋 Geral / Outros',
                type: 'campaign',
                tasks: []
            };

            // 3. Map tasks to columns
            tasks.forEach(task => {
                // Heuristic: Try to find campaign by name match or fallback to General
                // In future: Use task.input.campaignId
                const campaignName = task.input?.entityName;
                const matchedColumn = campaignColumns.find(c => c.title.includes(campaignName || 'ImpossibleMatch'));

                if (matchedColumn) {
                    matchedColumn.tasks.push(task);
                } else if (task.input?.entityName && !campaignColumns.some(c => c.title.includes(task.input?.entityName || ''))) {
                    // Task refers to an entity that doesn't match loaded campaigns? 
                    // Maybe create a temp column? Or put in General.
                    // Let's create a temp column if we want to show it.
                    // Or just put in General to avoid clutter.
                    generalColumn.tasks.push(task);
                } else {
                    generalColumn.tasks.push(task);
                }
            });

            columns = [generalColumn, ...campaignColumns];

            if (columns.length === 1 && columns[0].tasks.length === 0 && campaigns.length === 0) {
                columns = [{ id: 'empty', title: 'Nenhuma Campanha Ativa', type: 'campaign', tasks: [] }];
            }
        }

        set({ mode, columns });
    },

    moveTask: async (taskId: string, newStatus: OptimizationTaskStatus) => {
        // Optimistic Update
        const tasks = get().tasks.map(t =>
            t.id === taskId ? { ...t, status: newStatus } : t
        );
        set({ tasks });
        get().setMode(get().mode); // Refresh columns

        try {
            await apiClient.patch(`/api/optimization/tasks/${taskId}`, { status: newStatus });
            // In real world, we might reload tasks to get the 'output' or confirmed status
            await get().fetchTasks(get().selectedClientId ?? undefined);
        } catch (error) {
            // Revert on failure
            const msg = getApiErrorMessage(error, 'Failed to update task status');
            set({ error: msg });
            await get().fetchTasks(get().selectedClientId ?? undefined);
            throw error;
        }
    },

    runRule: async (ruleId: string, entityId: string, clientId: string) => {
        try {
            await apiClient.post('/api/optimization/run-rule', {
                clientId,
                ruleId,
                entityId,
                dryRun: false
            });
            // Refresh tasks to see if new one was created
            await get().fetchTasks(clientId);
        } catch (error) {
            const msg = getApiErrorMessage(error, 'Failed to run rule');
            set({ error: msg });
            throw error;
        }
    }
}));
