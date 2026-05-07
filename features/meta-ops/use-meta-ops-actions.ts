'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';

import { apiClient } from '@/lib/api/client/http';
import type { OptimizationRule } from '@/types/optimization';
import { ruleSuggestionByBucket, type OpsItem } from './model';

type RollbackByItem = Record<string, { clientId: string; ruleId: string; previous: Record<string, unknown> }>;

interface UseMetaOpsActionsParams {
  rulesByClient: Record<string, OptimizationRule[]>;
  rollbackByItem: RollbackByItem;
  setRulesByClient: Dispatch<SetStateAction<Record<string, OptimizationRule[]>>>;
  setRollbackByItem: Dispatch<SetStateAction<RollbackByItem>>;
  setRuleFeedback: (value: string | null) => void;
}

export function useMetaOpsActions({
  rulesByClient,
  rollbackByItem,
  setRulesByClient,
  setRollbackByItem,
  setRuleFeedback,
}: UseMetaOpsActionsParams) {
  const [savingRuleItemId, setSavingRuleItemId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const currentRuleParams = (item: OpsItem) => {
    const suggestion = ruleSuggestionByBucket(item.bucket, item.priority);
    const currentRule = (rulesByClient[item.clientId] ?? []).find((rule) => rule.id === suggestion.ruleId);
    return {
      ruleId: suggestion.ruleId,
      current: (currentRule?.parameters ?? {}) as Record<string, unknown>,
      suggested: suggestion.parameters,
      rationale: suggestion.rationale,
    };
  };

  const applyRuleSuggestion = async (item: OpsItem) => {
    const { ruleId, current, suggested } = currentRuleParams(item);
    const ok = window.confirm(`Aplicar sugestão de regra para ${item.clientName}?\n\nRegra: ${ruleId}`);
    if (!ok) return;

    try {
      setSavingRuleItemId(item.id);
      await apiClient.post(`/api/optimization/rules/${ruleId}/config`, {
        clientId: item.clientId,
        parameters: suggested,
      });

      setRulesByClient((previous) => ({
        ...previous,
        [item.clientId]: (previous[item.clientId] ?? []).map((rule) =>
          rule.id === ruleId ? { ...rule, parameters: suggested } : rule,
        ),
      }));

      setRollbackByItem((previous) => ({
        ...previous,
        [item.id]: { clientId: item.clientId, ruleId, previous: current },
      }));

      setRuleFeedback(`Regra ${ruleId} atualizada para ${item.clientName}.`);
    } catch {
      setRuleFeedback(`Falha ao atualizar regra ${ruleId}.`);
    } finally {
      setSavingRuleItemId(null);
    }
  };

  const rollbackRuleSuggestion = async (item: OpsItem) => {
    const rollback = rollbackByItem[item.id];
    if (!rollback) return;

    const ok = window.confirm(`Reverter ajuste da regra ${rollback.ruleId} para ${item.clientName}?`);
    if (!ok) return;

    try {
      setSavingRuleItemId(item.id);
      await apiClient.post(`/api/optimization/rules/${rollback.ruleId}/config`, {
        clientId: rollback.clientId,
        parameters: rollback.previous,
      });

      setRulesByClient((previous) => ({
        ...previous,
        [rollback.clientId]: (previous[rollback.clientId] ?? []).map((rule) =>
          rule.id === rollback.ruleId ? { ...rule, parameters: rollback.previous } : rule,
        ),
      }));

      setRollbackByItem((previous) => {
        const next = { ...previous };
        delete next[item.id];
        return next;
      });
      setRuleFeedback(`Rollback aplicado na regra ${rollback.ruleId}.`);
    } catch {
      setRuleFeedback(`Falha ao aplicar rollback da regra ${rollback.ruleId}.`);
    } finally {
      setSavingRuleItemId(null);
    }
  };

  const copyField = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((previous) => (previous === key ? null : previous)), 1800);
    } catch {
      setCopiedKey(null);
    }
  };

  return {
    savingRuleItemId,
    copiedKey,
    currentRuleParams,
    applyRuleSuggestion,
    rollbackRuleSuggestion,
    copyField,
  };
}
