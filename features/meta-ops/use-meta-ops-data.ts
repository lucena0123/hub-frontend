import { useEffect, useState } from 'react';

import { getAlerts, getClients, listActionProposals, type ActionProposal } from '@/lib/api/client';
import { apiClient } from '@/lib/api/client/http';
import type { Client, PerformanceAlert } from '@/types';
import type { OptimizationRule } from '@/types/optimization';

export function useMetaOpsData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [proposals, setProposals] = useState<ActionProposal[]>([]);
  const [rulesByClient, setRulesByClient] = useState<Record<string, OptimizationRule[]>>({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [clientData, alertsData] = await Promise.all([getClients(), getAlerts()]);
        setClients(clientData);
        setAlerts(alertsData.alerts ?? []);

        const [proposalGroups, rulesGroups] = await Promise.all([
          Promise.all(
            clientData.map(async (client) => {
              try {
                const response = await listActionProposals(client.id, { limit: 50 });
                return response.proposals ?? [];
              } catch {
                return [];
              }
            })
          ),
          Promise.all(
            clientData.map(async (client) => {
              try {
                const response = await apiClient.get<OptimizationRule[]>('/api/optimization/rules', { params: { clientId: client.id } });
                return [client.id, response.data] as const;
              } catch {
                return [client.id, [] as OptimizationRule[]] as const;
              }
            })
          ),
        ]);

        setProposals(proposalGroups.flat());
        setRulesByClient(Object.fromEntries(rulesGroups));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar central de operação Meta Ads.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return {
    loading,
    error,
    clients,
    alerts,
    proposals,
    rulesByClient,
    setRulesByClient,
  };
}
