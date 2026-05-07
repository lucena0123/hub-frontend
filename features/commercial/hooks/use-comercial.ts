'use client';

import { useCallback, useState } from 'react';
import {
  CommercialLead,
  CommercialLeadStatus,
} from '@/lib/api/client/commercial';
import { useAuth } from '@/contexts/auth-context';
import { downloadCommercialLeadsCsv } from '../commercial-leads-csv';
import { useCommercialDashboardData } from './use-commercial-dashboard-data';
import { useCommercialDerivedData } from './use-commercial-derived-data';
import { useCommercialLeadActions } from './use-commercial-lead-actions';
import { useCommercialFilters } from './use-commercial-filters';
import { useCommercialLeadMeta } from './use-commercial-lead-meta';
import { useCommercialMetaActions } from './use-commercial-meta-actions';
import { useCommercialTransitions } from './use-commercial-transitions';
import {
  PAGE_SIZE,
  hasOperationalInconsistency,
  isLeadBlocked,
  type ComercialErrorAction,
  type ConcluirDiagLead,
  type PendingTransition,
} from '../model';

export {
  COLUMNS,
  LOSS_REASONS,
  NEXT_STATUS,
  NURTURE_REASONS,
  type ComercialErrorAction,
  type ConcluirDiagLead,
  type PendingTransition,
} from '../model';

export function useComercial() {
  const { user } = useAuth();
  const canManageSensitive = user?.role === 'admin' || user?.role === 'manager';

  const [saving, setSaving] = useState(false);
  const [novoLeadOpen, setNovoLeadOpen] = useState(false);
  const [editarLeadOpen, setEditarLeadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<CommercialLead | null>(null);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [hoverColumn, setHoverColumn] = useState<CommercialLeadStatus | null>(null);
  const [pendingTransition, setPendingTransition] = useState<PendingTransition | null>(null);
  const [concluirDiagLead, setConcluirDiagLead] = useState<ConcluirDiagLead | null>(null);
  const [observacaoDiag, setObservacaoDiag] = useState('');
  const [pendingDeleteLead, setPendingDeleteLead] = useState<CommercialLead | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [transitionReason, setTransitionReason] = useState('');
  const [transitionDate, setTransitionDate] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorAction, setErrorAction] = useState<ComercialErrorAction>(null);
  const {
    timeline,
    integrationEvents,
    leadRequirements,
    leadAssets,
    leadMetaLoading,
    refreshSelectedLeadMeta,
  } = useCommercialLeadMeta(selectedLead);

  const filterState = useCommercialFilters();

  const handleFetchError = useCallback((message: string) => setError(message), []);
  const {
    dailySummary,
    dispatchHealth,
    fetchLeads,
    followupsDue,
    kpis,
    leads,
    loading,
    retentionDue,
    slaAlerts,
  } = useCommercialDashboardData({
    kpiRange: filterState.kpiRange,
    onError: handleFetchError,
    page: filterState.page,
    responsavelFilter: filterState.responsavelFilter,
    statusFilter: filterState.statusFilter,
  });
  const {
    onAddLeadAsset,
    onUpdateRequirementStatus,
  } = useCommercialMetaActions({
    refreshSelectedLeadMeta,
    setError,
    setSaving,
    setStatusMessage,
  });
  const {
    onDeleteLeadPermanently,
    onDispatchByStage,
    onGenerateBriefingLink,
    onRunCalendarSync,
    onSendSchedulingInvite,
    onSubmitBriefing,
    onTriggerFollowup,
    onUpdateOnboarding,
    onUpdatePrivacy,
    onUpdateProofs,
  } = useCommercialLeadActions({
    deleteConfirmText,
    deleteReason,
    fetchLeads,
    pendingDeleteLead,
    refreshSelectedLeadMeta,
    selectedLead,
    setDeleteConfirmText,
    setDeleteReason,
    setError,
    setErrorAction,
    setPendingDeleteLead,
    setSaving,
    setSelectedLead,
    setStatusMessage,
  });

  const {
    confirmConcluirDiag,
    confirmSpecialTransition,
    getAdvanceGuard,
    handleDropToColumn,
    onMoveLead,
    requestConcluirDiag,
    requestSpecialTransition,
  } = useCommercialTransitions({
    canManageSensitive,
    concluirDiagLead,
    draggingLeadId,
    fetchLeads,
    leads,
    observacaoDiag,
    pendingTransition,
    setConcluirDiagLead,
    setError,
    setErrorAction,
    setObservacaoDiag,
    setPendingTransition,
    setSaving,
    setStatusMessage,
    setTransitionDate,
    setTransitionReason,
    transitionDate,
    transitionReason,
  });

  const exportFilteredLeadsCsv = () => {
    downloadCommercialLeadsCsv(filteredLeads);
    setStatusMessage('Exportação CSV concluída.');
  };

  const {
    criticalPendencies,
    executiveFunnel,
    filteredLeads,
    leadsByStatus,
    operationalBottlenecks,
    responsavelOptions,
    unifiedTimeline,
  } = useCommercialDerivedData({
    blockedOnly: filterState.blockedOnly,
    followupsDue,
    inconsistentOnly: filterState.inconsistentOnly,
    integrationEvents,
    leads,
    origemFilter: filterState.origemFilter,
    responsavelFilter: filterState.responsavelFilter,
    retentionDue,
    search: filterState.search,
    selectedLead,
    slaAlerts,
    sortBy: filterState.sortBy,
    statusFilter: filterState.statusFilter,
    timeline,
  });

  return {
    leads, kpis, slaAlerts, dailySummary, dispatchHealth, followupsDue, retentionDue,
    leadRequirements, leadAssets,
    loading, saving, novoLeadOpen, setNovoLeadOpen, editarLeadOpen, setEditarLeadOpen,
    selectedLead, setSelectedLead, draggingLeadId, setDraggingLeadId, hoverColumn, setHoverColumn,
    pendingTransition, setPendingTransition,
    concluirDiagLead, setConcluirDiagLead, observacaoDiag, setObservacaoDiag,
    pendingDeleteLead, setPendingDeleteLead,
    deleteConfirmText, setDeleteConfirmText, deleteReason, setDeleteReason,
    transitionReason, setTransitionReason, transitionDate, setTransitionDate,
    statusMessage, setStatusMessage, error, setError, errorAction, setErrorAction, leadMetaLoading,
    ...filterState,
    filteredLeads, leadsByStatus, executiveFunnel, operationalBottlenecks, criticalPendencies, unifiedTimeline, responsavelOptions,
    isLeadBlocked, hasOperationalInconsistency, getAdvanceGuard,
    onMoveLead, handleDropToColumn, requestSpecialTransition, confirmSpecialTransition,
    requestConcluirDiag, confirmConcluirDiag,
    onDeleteLeadPermanently, onDispatchByStage, onTriggerFollowup, onSubmitBriefing,
    onGenerateBriefingLink, onSendSchedulingInvite, onUpdateProofs, onUpdateOnboarding, onUpdatePrivacy,
    onUpdateRequirementStatus, onAddLeadAsset, onRunCalendarSync, refreshSelectedLeadMeta,
    exportFilteredLeadsCsv,
    fetchLeads,
    pageSize: PAGE_SIZE,
  };
}
