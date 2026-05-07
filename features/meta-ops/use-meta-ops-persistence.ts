'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DONE_KEY,
  IMPLEMENTED_AT_KEY,
  ROLLBACK_KEY,
  STATUS_HISTORY_KEY,
  STATUS_KEY,
  type OpsStatus,
  type StatusHistoryEntry,
} from './model';

type RollbackByItem = Record<string, { clientId: string; ruleId: string; previous: Record<string, unknown> }>;

function readJsonStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function initialStatusMap() {
  const statusMap = readJsonStorage<Record<string, OpsStatus> | null>(STATUS_KEY, null);
  if (statusMap) return statusMap;

  const doneMap = readJsonStorage<Record<string, boolean> | null>(DONE_KEY, null);
  if (!doneMap) return {};

  return Object.fromEntries(
    Object.entries(doneMap).map(([key, value]) => [key, value ? 'implementado' : 'pendente']),
  ) as Record<string, OpsStatus>;
}

export function useMetaOpsPersistence() {
  const [statusMap, setStatusMap] = useState<Record<string, OpsStatus>>(initialStatusMap);
  const [implementedAtMap, setImplementedAtMap] = useState<Record<string, string>>(() =>
    readJsonStorage<Record<string, string>>(IMPLEMENTED_AT_KEY, {}),
  );
  const [statusHistoryMap, setStatusHistoryMap] = useState<Record<string, StatusHistoryEntry[]>>(() =>
    readJsonStorage<Record<string, StatusHistoryEntry[]>>(STATUS_HISTORY_KEY, {}),
  );
  const [collapsedClientGroup, setCollapsedClientGroup] = useState<Record<string, boolean>>({});
  const [rollbackByItem, setRollbackByItem] = useState<RollbackByItem>(() =>
    readJsonStorage<RollbackByItem>(ROLLBACK_KEY, {}),
  );
  const [ruleFeedback, setRuleFeedback] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STATUS_KEY, JSON.stringify(statusMap));
  }, [statusMap]);

  useEffect(() => {
    localStorage.setItem(IMPLEMENTED_AT_KEY, JSON.stringify(implementedAtMap));
  }, [implementedAtMap]);

  useEffect(() => {
    localStorage.setItem(STATUS_HISTORY_KEY, JSON.stringify(statusHistoryMap));
  }, [statusHistoryMap]);

  useEffect(() => {
    localStorage.setItem(ROLLBACK_KEY, JSON.stringify(rollbackByItem));
  }, [rollbackByItem]);

  const checkpointStateFor = useCallback((id: string) => {
    const implementedAt = implementedAtMap[id];
    if (!implementedAt) return { ready24: false, ready48: false, pending: true };

    const elapsedHours = Math.max(0, (Date.now() - new Date(implementedAt).getTime()) / (1000 * 60 * 60));
    return {
      ready24: elapsedHours >= 24,
      ready48: elapsedHours >= 48,
      pending: elapsedHours < 24,
    };
  }, [implementedAtMap]);

  const hasImplementationTimestamp = useCallback(
    (id: string) => Boolean(implementedAtMap[id]),
    [implementedAtMap],
  );

  const setItemStatus = useCallback((id: string, status: OpsStatus) => {
    if (
      (status === 'validado_ganhou' || status === 'validado_neutro' || status === 'validado_piorou') &&
      !hasImplementationTimestamp(id)
    ) {
      setRuleFeedback('Para validar resultado, marque primeiro como implementado (com timestamp).');
      return;
    }

    const nowIso = new Date().toISOString();
    setStatusMap((prev) => ({ ...prev, [id]: status }));
    setStatusHistoryMap((prev) => {
      const current = prev[id] ?? [];
      const last = current[current.length - 1];
      if (last?.status === status) return prev;
      return {
        ...prev,
        [id]: [...current, { status, at: nowIso }].slice(-8),
      };
    });

    if (status === 'implementado') {
      setImplementedAtMap((prev) => ({ ...prev, [id]: prev[id] ?? nowIso }));
      return;
    }

    if (status === 'pendente') {
      setImplementedAtMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }, [hasImplementationTimestamp]);

  const validationView = useCallback((id: string, status: OpsStatus) => {
    const implementedAt = implementedAtMap[id];
    if (!implementedAt) {
      return {
        implementedAtLabel: status === 'implementado' ? 'Implementado sem data (legado)' : 'Ainda não implementado',
        checkpoint24: 'pendente',
        checkpoint48: 'pendente',
        nextCheckpoint: 'Próximo checkpoint: implementar para iniciar 24h/48h.',
      };
    }

    const implementedMs = new Date(implementedAt).getTime();
    const elapsedHours = Math.max(0, (Date.now() - implementedMs) / (1000 * 60 * 60));
    const validated = status === 'validado_ganhou' || status === 'validado_neutro' || status === 'validado_piorou';

    const checkpoint24 = validated ? 'validado' : elapsedHours >= 24 ? 'pronto para validar' : 'pendente';
    const checkpoint48 = validated ? 'validado' : elapsedHours >= 48 ? 'pronto para validar' : 'pendente';

    const nextCheckpoint = validated
      ? 'Próximo checkpoint: validação concluída.'
      : elapsedHours < 24
        ? `Próximo checkpoint: 24h em ~${Math.ceil(24 - elapsedHours)}h.`
        : elapsedHours < 48
          ? `Próximo checkpoint: 48h em ~${Math.ceil(48 - elapsedHours)}h.`
          : 'Próximo checkpoint: 24h/48h já prontos para validação.';

    return {
      implementedAtLabel: `Implementado em ${new Date(implementedAt).toLocaleString('pt-BR')}`,
      checkpoint24,
      checkpoint48,
      nextCheckpoint,
    };
  }, [implementedAtMap]);

  const toggleClientGroup = useCallback((key: string) => {
    setCollapsedClientGroup((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return {
    statusMap,
    implementedAtMap,
    statusHistoryMap,
    collapsedClientGroup,
    rollbackByItem,
    ruleFeedback,
    setRollbackByItem,
    setRuleFeedback,
    checkpointStateFor,
    hasImplementationTimestamp,
    setItemStatus,
    validationView,
    toggleClientGroup,
  };
}
